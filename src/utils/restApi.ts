import hostname from './hostname'
import Axios from 'axios'

const restApi = Axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`,
  withCredentials: true,
  // Django CSRF setup
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
})

export default restApi
