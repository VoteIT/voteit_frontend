import { RestApiConfig } from '@/composables/types'
import { openAlertEvent } from '@/utils'
import restApi from '@/utils/restApi'
import { AxiosError, AxiosPromise } from 'axios'
import { Transition, WorkflowState } from './types'

const DEFAULT_CONFIG: RestApiConfig = {
  alertOnError: true
}

enum HTTPMethod {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Patch = 'patch',
  Delete = 'delete'
}

export default class ContentAPI<T, K=number> {
  private endpoint: string
  private workflowStates?: WorkflowState[]
  config: RestApiConfig

  constructor (endpoint: string, workflowStates?: WorkflowState[], config?: RestApiConfig) {
    this.endpoint = endpoint
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
    this.workflowStates = workflowStates
  }

  private handleError (error: AxiosError) {
    const response = error.response
    if (response) {
      const title = `HTTP ${response.status}`
      let text = 'Unknown error'
      let sticky = false
      // Default strings from response.data, unless special cases below
      if (typeof response.data === 'string') {
        text = response.data
      } else if (typeof response.data === 'object') {
        text = JSON.stringify(response.data)
      }
      switch (response.status) {
        case 500:
          text = 'Server error'
          break
        case 400:
          sticky = true
          break
      }
      openAlertEvent.emit({
        title,
        text,
        sticky,
        level: 'error'
      })
    } else {
      openAlertEvent.emit({
        title: 'Error',
        text: 'No response from server',
        level: 'error'
      })
    }
  }

  private call (method: HTTPMethod, url: string, config?: RestApiConfig) {
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
    return request
  }

  add (data: Partial<T>): AxiosPromise<T> { // No type, because readonly-fields and such are incompat w post data
    return this.call(HTTPMethod.Post, this.endpoint, { data })
  }

  list (params?: object): AxiosPromise<T[]> {
    return this.call(HTTPMethod.Get, this.endpoint, { params })
  }

  retrieve (pk: K): AxiosPromise<T> {
    return this.call(HTTPMethod.Get, `${this.endpoint}${pk}/`)
  }

  put (pk: K, data: Omit<T, 'pk'>): AxiosPromise<T> {
    return this.call(HTTPMethod.Put, `${this.endpoint}${pk}/`, { data })
  }

  patch (pk: K, data: Partial<T>): AxiosPromise<T> {
    return this.call(HTTPMethod.Patch, `${this.endpoint}${pk}/`, { data })
  }

  delete (pk: K): AxiosPromise {
    return this.call(HTTPMethod.Delete, `${this.endpoint}${pk}/`)
  }

  action (pk: number, action: string, data?: object): AxiosPromise<T>
  action (action: string, data: object): AxiosPromise<T>
  action (pkOrAction: number | string, actionOrData: string | object, data?: object) {
    // Cannot handle K = string
    if (typeof pkOrAction === 'number') {
      return this.call(HTTPMethod.Post, `${this.endpoint}${pkOrAction}/${actionOrData}/`, { data })
    } else if (typeof actionOrData === 'object') {
      return this.call(HTTPMethod.Post, `${this.endpoint}${pkOrAction}/`, { data: actionOrData })
    }
  }

  transition (pk: number, name: string): AxiosPromise {
    // Cannot handle K = string
    if (this.workflowStates) {
      return this.action(pk, 'transitions', {
        transition: name
      })
    } else {
      throw new Error(`No Workflow States defined for ${this.endpoint}`)
    }
  }

  async getTransitions (pk: number): Promise<Transition[]> {
    // Cannot handle K = string
    const { data }: { data: Transition[] } = await this.call(HTTPMethod.Get, `${this.endpoint}${pk}/transitions/`)
    return data.map(t => {
      t.icon = this.workflowStates?.find(s => s.transition === t.name)?.icon
      return t
    })
  }
}
