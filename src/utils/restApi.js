import hostname from './hostname'
import Axios from 'axios'

const restApi = Axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`
})

// Django CSRF setup
restApi.defaults.xsrfCookieName = 'csrftoken'
restApi.defaults.xsrfHeaderName = 'X-CSRFTOKEN'

export default restApi
