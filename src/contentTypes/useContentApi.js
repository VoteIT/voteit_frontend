import useRestApi from '@/composables/useRestApi'

export default function useContentApi (endpoint, states, config) {
  const restApi = useRestApi(config)

  function add (data) {
    return restApi.post(endpoint, data)
  }

  function list (params) {
    return restApi.get(endpoint, { params })
  }

  function retrieve (pk) {
    return restApi.get(`${endpoint}${pk}/`)
  }

  function put (pk, data) {
    return restApi.put(`${endpoint}${pk}/`, data)
  }

  function patch (pk, data) {
    return restApi.patch(`${endpoint}${pk}/`, data)
  }

  function _delete (pk) {
    return restApi.delete(`${endpoint}${pk}/`)
  }

  function action (...args) {
    if (typeof args[0] === 'number') {
      const [pk, action, data] = args
      return restApi.post(`${endpoint}${pk}/${action}/`, data)
    } else {
      const [action, data] = args
      return restApi.post(`${endpoint}${action}/`, data)
    }
  }

  function transition (pk, name) {
    if (states) {
      return restApi.post(`${endpoint}${pk}/transitions/`, {
        transition: name
      })
    } else {
      throw new Error(`No Workflow States defined for ${endpoint}`)
    }
  }

  async function getTransitions (pk) {
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
