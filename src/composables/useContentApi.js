import apiEndpoints from '../schemas/apiEndpoints'
import useRestApi from './useRestApi'

export default function useContentApi (contentType, config) {
  if (!contentType) {
    throw new Error('Instantiate contentApi using useContentType(name).')
  }
  const restApi = useRestApi(config)
  const endpoint = apiEndpoints[contentType]

  if (!endpoint) {
    throw new Error(`Endpoint for contentType ${contentType} is not defined.`)
  }

  function add (data) {
    return restApi.post(endpoint.uri + '/', data)
  }

  function list (params) {
    return restApi.get(endpoint.uri + '/', { params })
  }

  function retrieve (pk) {
    return restApi.get(`${endpoint.uri}/${pk}/`)
  }

  function put (pk, data) {
    return restApi.put(`${endpoint.uri}/${pk}/`, data)
  }

  function patch (pk, data) {
    return restApi.patch(`${endpoint.uri}/${pk}/`, data)
  }

  function _delete (pk) {
    return restApi.delete(`${endpoint.uri}/${pk}/`)
  }

  function transition (pk, name) {
    if (endpoint.states) {
      return restApi.post(`${endpoint.uri}/${pk}/transitions/`, {
        transition: name
      })
    }
  }

  async function getTransitions (pk) {
    if (endpoint.states) {
      const { data } = await restApi.get(`${endpoint.uri}/${pk}/transitions/`)
      return endpoint.states.filter(
        s => data.available_transitions.includes(s.transition)
      )
    } else {
      throw new Error(`No states defined for contentType ${contentType}`)
    }
  }

  return {
    add,
    list,
    retrieve,
    put,
    patch,
    delete: _delete,

    states: endpoint.states,
    getTransitions,
    transition
  }
}
