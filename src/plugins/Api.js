import Axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/'
const token = localStorage.APIAuthToken

// TODO
if (!token) {
  Axios.post(`${BASE_URL}dev-login/`)
    .then(({ data }) => {
      localStorage.APIAuthToken = data.key
      location.reload() // TODO Obviously quickfix
    })
}

export default {
  install (app) {
    app.config.globalProperties.$api = Axios.create({
      baseURL: 'http://localhost:8000/api/',
      headers: {
        Authorization: `Token ${token}`
      }
    })
  }
}
