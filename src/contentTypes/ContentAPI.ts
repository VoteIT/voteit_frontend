import restApi, { HTTPMethod, RequestConfig } from '@/utils/restApi'

/**
 * Thin REST client bound to a content type's endpoint.
 *
 * Errors are never displayed here — every rejection is the calling view's to
 * handle, preferably with `useErrorHandler`.
 */
export default class ContentAPI<
  T extends { pk?: number; state?: string },
  K = number
> {
  private endpoint: string
  private config: RequestConfig

  constructor(endpoint: string, config?: RequestConfig) {
    this.endpoint = endpoint
    this.config = { ...(config || {}) }
  }

  private call<Type>(method: HTTPMethod, url: string, config?: RequestConfig) {
    return restApi.request<Type>({
      ...this.config,
      ...(config || {}),
      method,
      url
    })
  }

  public add(data: Partial<T>): Promise<T> {
    return this.call('post', this.endpoint, { body: data })
  }

  public list<RT = T[]>(params?: Record<string, unknown>): Promise<RT> {
    return this.call('get', this.endpoint, { params })
  }

  public retrieve(pk: K): Promise<T> {
    return this.call('get', `${this.endpoint}${pk}/`)
  }

  public put(pk: K, data: Omit<T, 'pk'>, config?: RequestConfig): Promise<T> {
    return this.call('put', `${this.endpoint}${pk}/`, { body: data, ...config })
  }

  public patch(pk: K, data: Partial<T>): Promise<T> {
    return this.call('patch', `${this.endpoint}${pk}/`, { body: data })
  }

  public delete(pk: K): Promise<unknown> {
    return this.call('delete', `${this.endpoint}${pk}/`)
  }

  public listAction<Type>(
    action: string,
    data?: unknown,
    config?: RequestConfig
  ) {
    const { method = 'post', ...rest } = config ?? {}
    return this.call<Type>(method, `${this.endpoint}${action}/`, {
      body: data,
      ...rest
    })
  }

  public action<Type>(
    action: string,
    id: K,
    data?: unknown,
    config?: RequestConfig
  ) {
    const { method = 'post', ...rest } = config ?? {}
    return this.call<Type>(method, `${this.endpoint}${id}/${action}/`, {
      body: data,
      ...rest
    })
  }
}
