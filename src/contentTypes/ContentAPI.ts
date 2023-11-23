import { AxiosError, AxiosPromise } from 'axios'

import { AlertLevel, RestApiConfig } from '@/composables/types'
import { openAlertEvent } from '@/utils/events'
import restApi from '@/utils/restApi'

import { ConditionalWorkflowStates, Transition } from './types'

const DEFAULT_CONFIG: RestApiConfig = {
  alertOnError: true
}

type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export default class ContentAPI<
  T extends { pk?: number; state?: string },
  K = number
> {
  private endpoint: string
  private workflowStates?: ConditionalWorkflowStates<T>
  private config: RestApiConfig

  constructor(
    endpoint: string,
    workflowStates?: ConditionalWorkflowStates<T>,
    config?: RestApiConfig
  ) {
    this.endpoint = endpoint
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
    this.workflowStates = workflowStates
  }

  // TODO Use parseRestError from utils.restApi
  private handleError(error: AxiosError) {
    const response = error.response
    if (!response)
      return openAlertEvent.emit({
        title: 'Error',
        text: 'No response from server',
        level: AlertLevel.Error
      })

    let title = `HTTP ${response.status}`
    let text = 'Unknown error'
    let sticky = false
    // Default strings from response.data, unless special cases below
    if (typeof response.data === 'string') text = response.data
    else if (typeof response.data === 'object')
      text = JSON.stringify(response.data)
    switch (response.status) {
      case 500:
        text = 'Server error'
        break
      case 400:
        sticky = true
        if ('error' in response.data) {
          title = 'Error'
          text = response.data.error
        }
        break
    }
    openAlertEvent.emit({
      title,
      text,
      sticky,
      level: AlertLevel.Error
    })
  }

  private call<Type>(method: HTTPMethod, url: string, config?: RestApiConfig) {
    config = {
      ...this.config,
      ...(config || {}),
      method,
      url
    }
    const request = restApi(config)
    if (this.config.alertOnError) {
      request.catch(this.handleError)
    }
    return request as AxiosPromise<Type>
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

  public put(pk: K, data: Omit<T, 'pk'>): AxiosPromise<T> {
    return this.call('put', `${this.endpoint}${pk}/`, { data })
  }

  public patch(pk: K, data: Partial<T>): AxiosPromise<T> {
    return this.call('patch', `${this.endpoint}${pk}/`, { data })
  }

  public delete(pk: K): AxiosPromise {
    return this.call('delete', `${this.endpoint}${pk}/`)
  }

  public listAction<Type>(action: string, data?: object, method?: HTTPMethod) {
    return this.call<Type>(method ?? 'post', `${this.endpoint}${action}/`, {
      data
    })
  }

  public action<Type>(
    id: K,
    action: string,
    data?: object,
    method?: HTTPMethod
  ) {
    return this.call<Type>(
      method ?? 'post',
      `${this.endpoint}${id}/${action}/`,
      {
        data
      }
    )
  }

  public transition(id: K, name: string): AxiosPromise<Partial<T>> {
    if (!this.workflowStates)
      throw new Error(`No Workflow States defined for ${this.endpoint}`)
    return this.action(id, 'transitions', {
      transition: name
    })
  }

  public async getTransitions(id: K): Promise<Transition[]> {
    const { data }: { data: Transition[] } = await this.call(
      'get',
      `${this.endpoint}${id}/transitions/`
    )
    return data.map((t) => ({
      ...t,
      icon: this.workflowStates?.find((s) => s.transition === t.name)?.icon
    }))
  }
}
