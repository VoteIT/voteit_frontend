import hostname from './hostname'
import Axios from 'axios'

const restApi = Axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`
})

// Django CSRF setup
restApi.defaults.xsrfCookieName = 'csrftoken'
restApi.defaults.xsrfHeaderName = 'X-CSRFTOKEN'

export function setAuthToken (token?: string) {
  if (token) {
    restApi.defaults.headers.common.Authorization = `Token ${token}`
  } else {
    delete restApi.defaults.headers.common.Authorization
  }
}

export default restApi
