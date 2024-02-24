import axios from 'axios'
import type { Dictionary } from 'lodash'

import hostname from './hostname'

export function parseRestError(e: unknown): Dictionary<string[]> {
  if (axios.isAxiosError(e)) {
    if (!e.response) return { __root__: ['No response from server'] }
    const { data } = e.response
    return Array.isArray(data) ? { __root__: data } : data
  }
  return { __root__: ['Unknown error'] }
}

export function getApiLink(path: string) {
  return restApi.defaults.baseURL + path
}

const restApi = axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`,
  withCredentials: true,
  withXSRFToken: import.meta.env.VITE_BACKEND_PORT && true, // Should be true for dev environment, undefined for prod
  // Django CSRF setup
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
})

export default restApi
