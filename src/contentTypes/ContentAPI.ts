import { AlertLevel, RestApiConfig } from '@/composables/types'
import { openAlertEvent } from '@/utils/events'
import restApi, {
  HTTPMethod,
  NetworkError,
  RequestConfig,
  isApiError
} from '@/utils/restApi'

const DEFAULT_CONFIG: RestApiConfig = {
  alertOnError: true
}

export default class ContentAPI<
  T extends { pk?: number; state?: string },
  K = number
> {
  private endpoint: string
  private config: RestApiConfig

  constructor(endpoint: string, config?: RestApiConfig) {
    this.endpoint = endpoint
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
  }

  private displayError(title: string | number, text: string, sticky = false) {
    openAlertEvent.emit({
      level: AlertLevel.Error,
      sticky,
      text,
      title: typeof title === 'number' ? `HTTP ${title}` : title
    })
  }

  /**
   * Doesn't use restApi.parseRestError because it displays title and text.
   * Note: This should be phased out, handling errors in calling views.
   */
  private handleError(e: unknown) {
    if (e instanceof NetworkError)
      return this.displayError('Error', 'No response from server')
    if (!isApiError(e)) {
      console.error('Programming error', e)
      return this.displayError('Unknown error', 'Check console for details.')
    }

    const { data } = e
    switch (e.status) {
      case 500:
        return this.displayError(e.status, 'Server error')
      case 400:
        if (
          data !== null &&
          typeof data === 'object' &&
          'error' in data &&
          typeof data.error === 'string'
        )
          return this.displayError('Error', data.error, true)
      default: {
        const text =
          typeof data === 'string'
            ? data
            : typeof data === 'object'
              ? JSON.stringify(data)
              : 'Unknown error'
        return this.displayError(e.status, text.slice(0, 200))
      }
    }
  }

  private call<Type>(method: HTTPMethod, url: string, config?: RestApiConfig) {
    config = {
      ...this.config,
      ...(config || {}),
      method,
      url
    }
    const request = restApi.request<Type>(config)
    if (this.config.alertOnError) request.catch(this.handleError.bind(this))
    return request
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
