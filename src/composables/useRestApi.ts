import useAlert from './useAlert'
import { restApi } from '@/utils'
import { AxiosError } from 'axios'
import { RestApiConfig } from './types'

const DEFAULT_CONFIG: RestApiConfig = {
  alertOnError: true
}

export default function useRestApi (config?: RestApiConfig) {
  const defaultConfig = Object.assign({}, DEFAULT_CONFIG, config)
  const { alert } = useAlert()

  function setAuthToken (token?: string) {
    if (token) {
      restApi.defaults.headers.common.Authorization = `Token ${token}`
    } else {
      delete restApi.defaults.headers.common.Authorization
    }
  }

  function restError (error: AxiosError) {
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

  async function get (uri: string, config?: RestApiConfig) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.get(uri, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function post (uri: string, data: object, config?: RestApiConfig) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.post(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function put (uri: string, data: object, config?: RestApiConfig) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.put(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function patch (uri: string, data: object, config?: RestApiConfig) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.patch(uri, data, config)
    if (config.alertOnError) {
      request.catch(restError)
    }
    return request
  }

  async function _delete (uri: string, config?: RestApiConfig) {
    config = Object.assign({}, defaultConfig, config)
    const request = restApi.delete(uri, config)
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
