import axios from 'axios'
import { RestError } from './types'

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
  if (!axios.isAxiosError(e)) return nonFieldErrors(['Unknown error'])
  if (!e.status || !e.response)
    return nonFieldErrors(['No response from server'])
  const statusError = statusErrors[e.status]
  if (statusError) return nonFieldErrors([statusError])
  const { data } = e.response
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

export default axios.create({
  baseURL: buildServerURL('/api/'),
  withCredentials: true,
  withXSRFToken: import.meta.env.VITE_BACKEND_PORT && true, // Should be true for dev environment, undefined for prod
  // Django CSRF setup
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
})
