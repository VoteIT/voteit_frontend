import Axios from 'axios'
import useAlert from './useAlert'

const BASE_URL = 'http://localhost:8000/api/'
const restApi = Axios.create({
  baseURL: BASE_URL
})

export default function useRestApi () {
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

  return {
    setAuthToken,
    restApi,
    restError
  }
}
