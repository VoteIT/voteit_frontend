import useRestApi from '@/composables/useRestApi'
import { AxiosPromise } from 'axios'
import { WorkflowState } from './types'

export default function useContentApi (endpoint: string, states?: WorkflowState[], config?: object) {
  const restApi = useRestApi(config)

  function add (data: object) {
    return restApi.post(endpoint, data)
  }

  function list (params?: object) {
    return restApi.get(endpoint, { params })
  }

  function retrieve (pk: number) {
    return restApi.get(`${endpoint}${pk}/`)
  }

  function put (pk: number, data: object) {
    return restApi.put(`${endpoint}${pk}/`, data)
  }

  function patch (pk: number, data: object) {
    return restApi.patch(`${endpoint}${pk}/`, data)
  }

  function _delete (pk: number) {
    return restApi.delete(`${endpoint}${pk}/`)
  }

  function action (pk: number, action: string, data?: object): AxiosPromise
  function action (action: string, data: object): AxiosPromise
  function action (pkOrAction: number | string, actionOrData: string | object, data?: object) {
    if (typeof pkOrAction === 'number') {
      return restApi.post(`${endpoint}${pkOrAction}/${actionOrData}/`, data || {})
    } else if (typeof actionOrData === 'object') {
      return restApi.post(`${endpoint}${pkOrAction}/`, actionOrData)
    }
  }

  function transition (pk: number, name: string) {
    if (states) {
      return restApi.post(`${endpoint}${pk}/transitions/`, {
        transition: name
      })
    } else {
      throw new Error(`No Workflow States defined for ${endpoint}`)
    }
  }

  async function getTransitions (pk: number) {
    if (states) {
      const { data } = await restApi.get(`${endpoint}${pk}/transitions/`)
      return states.filter(
        s => data.available_transitions.includes(s.transition)
      )
    } else {
      throw new Error(`No Workflow States defined for ${endpoint}`)
    }
  }

  return {
    add,
    list,
    retrieve,
    put,
    patch,
    action,
    delete: _delete,

    states,
    getTransitions,
    transition
  }
}
