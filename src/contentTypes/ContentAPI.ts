import { isAxiosError, AxiosPromise, AxiosRequestConfig } from 'axios'

import { AlertLevel, RestApiConfig } from '@/composables/types'
import { openAlertEvent } from '@/utils/events'
import restApi from '@/utils/restApi'

const DEFAULT_CONFIG: RestApiConfig = {
  alertOnError: true
}

type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

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
    if (!isAxiosError(e)) {
      console.error('Programming error', e)
      return this.displayError('Unknown error', 'Check console for details.')
    }
    if (!e.response || !e.status)
      return this.displayError('Error', 'No response from server')

    const { data } = e.response
    switch (e.response.status) {
      case 500:
        return this.displayError(e.status, 'Server error')
      case 400:
        if (
          data !== null &&
          typeof data === 'object' &&
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
    const request = restApi<Type>(config)
    if (this.config.alertOnError) request.catch(this.handleError.bind(this))
    return request
  }

  public add(data: Partial<T>): AxiosPromise<T> {
    return this.call('post', this.endpoint, { data })
  }

  public list<RT = T[]>(params?: object): AxiosPromise<RT> {
    return this.call('get', this.endpoint, { params })
  }

  public retrieve(pk: K): AxiosPromise<T> {
    return this.call('get', `${this.endpoint}${pk}/`)
  }

  public put(
    pk: K,
    data: Omit<T, 'pk'>,
    config?: AxiosRequestConfig
  ): AxiosPromise<T> {
    return this.call('put', `${this.endpoint}${pk}/`, { data, ...config })
  }

  public patch(pk: K, data: Partial<T>): AxiosPromise<T> {
    return this.call('patch', `${this.endpoint}${pk}/`, { data })
  }

  public delete(pk: K): AxiosPromise {
    return this.call('delete', `${this.endpoint}${pk}/`)
  }

  public listAction<Type>(
    action: string,
    data?: object,
    config?: AxiosRequestConfig
  ) {
    const { method = 'post', ...rest } = config ?? {}
    return this.call<Type>(method as HTTPMethod, `${this.endpoint}${action}/`, {
      data,
      ...rest
    })
  }

  public action<Type>(
    action: string,
    id: K,
    data?: object,
    config?: AxiosRequestConfig
  ) {
    const { method = 'post', ...rest } = config ?? {}
    return this.call<Type>(
      method as HTTPMethod,
      `${this.endpoint}${id}/${action}/`,
      { data, ...rest }
    )
  }
}
