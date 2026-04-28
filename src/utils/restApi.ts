import axios from 'axios'

export function parseRestError(e: unknown): Record<string, string[]> {
  if (axios.isAxiosError(e)) {
    if (!e.response) return { __root__: ['No response from server'] }
    const { data } = e.response
    return Array.isArray(data) ? { __root__: data } : data
  }
  return { __root__: ['Unknown error'] }
}

/**
 * Build a server URL
 * @param path Should begin with /
 */
function buildServerURL(path: string) {
  return `${location.protocol}//${location.host}${path}`
}

export function getApiLink(path: string) {
  return buildServerURL(`/api/${path}`)
}

const restApi = axios.create({
  baseURL: buildServerURL('/api/'),
  withCredentials: true,
  withXSRFToken: import.meta.env.VITE_BACKEND_PORT && true, // Should be true for dev environment, undefined for prod
  // Django CSRF setup
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
})

export default restApi
