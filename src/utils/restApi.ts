import hostname from './hostname'
import axios from 'axios'

export function parseRestError (e: unknown) {
  // TODO
  if (axios.isAxiosError(e)) {
    if (!e.response) return { __root__: ['Unkown error'] }
    return e.response.data as Record<string, string[]>
  }
  return { __root__: ['Unkown error'] }
}

export function getApiLink (path: string) {
  return restApi.defaults.baseURL + path
}

const restApi = axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`,
  withCredentials: true,
  // Django CSRF setup
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
})

export default restApi
