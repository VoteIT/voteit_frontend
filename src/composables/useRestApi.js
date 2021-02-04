import useAlert from './useAlert'
import { restApi } from '@/utils'

const DEFAULT_CONFIG = {
  alertOnError: true
}

export default function useRestApi (config) {
  const defaultConfig = Object.assign({}, DEFAULT_CONFIG, config)
  const { alert } = useAlert()

  function setAuthToken (token) {
    if (token) {
      restApi.defaults.headers.common.Authorization = `Token ${token}`
    } else {
      delete restApi.defaults.headers.common.Authorization
    }
  }

  function restError ({ response }) {
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
      alert({
        title,
        text,
        sticky,
        level: 'error'
      })
    } else {
      alert({
        title: 'Error',
        text: 'No response from server',
        level: 'error'
      })
    }
  }

  async function get (uri, config) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.get(uri, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function post (uri, data) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.post(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function put (uri, data, config) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.put(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function patch (uri, data, config) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.patch(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function _delete (uri, config) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.delete(uri)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  return {
    setAuthToken,
    get,
    post,
    put,
    patch,
    delete: _delete
  }
}
