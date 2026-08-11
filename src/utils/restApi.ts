import { RestError } from './types'

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * A fetch init with `url`/`params` folded in. Everything not named here
 * (headers, signal, cache, keepalive, redirect, …) behaves as it does in
 * fetch and is forwarded untouched.
 *
 * `credentials` is omitted because this client always sends them. `body` is
 * omitted only so it can be widened: an interface may narrow an inherited
 * property but never widen one, and this client accepts any value and
 * serialises it.
 */
export interface RequestConfig extends Omit<
  RequestInit,
  'body' | 'credentials'
> {
  method?: HTTPMethod
  url?: string
  /** Sent as-is if it's already a BodyInit, otherwise serialised to JSON. */
  body?: unknown
  params?: Record<string, unknown>
  /** Escape hatch for the few callers that need the status or headers. */
  onResponse?: (response: Response) => void
}

/**
 * The server responded, but with a non-2xx status.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
    public readonly headers: Headers,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * No response at all — server unreachable, DNS failure, CORS rejection etc.
 */
export class NetworkError extends Error {
  constructor(message = 'No response from server') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

function nonFieldErrors(non_field_errors: string[]) {
  return { non_field_errors }
}

const statusErrors: Record<string, string> = {
  401: 'Unauthorized (HTTP 401)',
  403: 'Forbidden (HTTP 403)',
  500: 'Server error (HTTP 500)'
}

function parseErrorObject(data: object) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value as string[]]
      if (typeof value === 'string') return [key, [value]]
      return [key, [JSON.stringify(value)]]
    })
  ) as RestError
}

export function parseRestError<T extends {} = {}>(e: unknown): RestError<T> {
  if (e instanceof NetworkError)
    return nonFieldErrors(['No response from server'])
  if (!isApiError(e)) return nonFieldErrors(['Unknown error'])
  const statusError = statusErrors[e.status]
  if (statusError) return nonFieldErrors([statusError])
  const { data } = e
  if (typeof data === 'string') return nonFieldErrors([data.slice(0, 200)])
  if (Array.isArray(data)) return nonFieldErrors(data)
  if (data === null || typeof data !== 'object')
    return nonFieldErrors(['Unknown error'])
  return parseErrorObject(data)
}

/**
 * Build a server URL
 * @param path Should begin with /
 */
function buildServerURL(path: string) {
  return `${location.protocol}//${location.host}${path}`
}

export function getApiLink(path: string) {
  return buildServerURL(`/api/${path}`)
}

export const baseURL = buildServerURL('/api/')

/**
 * Headers applied to every request, unless overridden per call.
 */
const defaultHeaders: Record<string, string> = {}

export function setDefaultHeader(name: string, value: string) {
  defaultHeaders[name] = value
}

/**
 * Global response hooks, replacing axios response interceptors.
 * Returns an unsubscribe function.
 */
type ResponseHook = (response: Response) => void
const responseHooks = new Set<ResponseHook>()

export function addResponseHook(hook: ResponseHook) {
  responseHooks.add(hook)
  return () => responseHooks.delete(hook)
}

// Django CSRF setup
const XSRF_COOKIE_NAME = 'csrftoken'
const XSRF_HEADER_NAME = 'X-CSRFTOKEN'

function readCookie(name: string) {
  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
  return cookie && decodeURIComponent(cookie.slice(prefix.length))
}

function buildURL(url: string, params?: Record<string, unknown>) {
  const target = new URL(url, baseURL)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value))
      for (const item of value) target.searchParams.append(key, String(item))
    else target.searchParams.append(key, String(value))
  }
  return target
}

/**
 * FormData, Blob and friends must be passed through untouched, so the browser
 * can set Content-Type (including the multipart boundary) itself.
 */
function isRawBody(data: unknown): data is BodyInit {
  return (
    data instanceof FormData ||
    data instanceof Blob ||
    data instanceof URLSearchParams ||
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data) ||
    typeof data === 'string'
  )
}

/**
 * fetch only rejects when the request never got a response.
 */
function rethrowAsNetworkError(e: unknown): never {
  // Aborts are not network failures — let callers handle them as such.
  if (e instanceof Error && e.name === 'AbortError') throw e
  throw new NetworkError()
}

async function parseBody(response: Response) {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  if (response.headers.get('content-type')?.includes('json'))
    return JSON.parse(text)
  return text
}

async function request<T = unknown>(config: RequestConfig): Promise<T> {
  const {
    method = 'get',
    url = '',
    body: payload,
    params,
    headers,
    onResponse,
    ...init
  } = config
  const target = buildURL(url, params)

  // Go through the Headers constructor rather than spreading, so every
  // HeadersInit form (Headers, entry pairs, plain object) merges correctly.
  const requestHeaders = new Headers(defaultHeaders)
  new Headers(headers).forEach((value, key) => requestHeaders.set(key, value))

  let body: BodyInit | undefined
  if (payload !== undefined && method !== 'get') {
    if (isRawBody(payload)) {
      body = payload
      // Never send a hand-set multipart Content-Type: the boundary would be missing.
      requestHeaders.delete('Content-Type')
    } else {
      body = JSON.stringify(payload)
      if (!requestHeaders.has('Content-Type'))
        requestHeaders.set('Content-Type', 'application/json')
    }
  }

  // Match axios' xsrf behaviour: send the token on same-origin requests.
  if (target.origin === location.origin) {
    const xsrfToken = readCookie(XSRF_COOKIE_NAME)
    if (xsrfToken) requestHeaders.set(XSRF_HEADER_NAME, xsrfToken)
  }

  const response = await fetch(target, {
    ...init,
    method: method.toUpperCase(),
    credentials: 'include',
    headers: requestHeaders,
    body
  }).catch(rethrowAsNetworkError)

  for (const hook of [...responseHooks]) hook(response)
  onResponse?.(response)

  const responseData = await parseBody(response)
  if (!response.ok)
    throw new ApiError(
      response.status,
      responseData,
      response.headers,
      `${response.status} ${response.statusText}`.trim()
    )
  return responseData as T
}

function withMethod(method: HTTPMethod) {
  return <T = unknown>(url: string, config?: RequestConfig) =>
    request<T>({ ...config, method, url })
}

function withBody(method: HTTPMethod) {
  return <T = unknown>(url: string, body?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, method, url, body })
}

export default {
  request,
  get: withMethod('get'),
  delete: withMethod('delete'),
  post: withBody('post'),
  put: withBody('put'),
  patch: withBody('patch')
}
