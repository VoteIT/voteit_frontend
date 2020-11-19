import Axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/'

const restApi = Axios.create({
  baseURL: BASE_URL
})

function setAuthToken (token) {
  if (token) {
    restApi.defaults.headers.common.Authorization = `Token ${token}`
  } else {
    delete restApi.defaults.headers.common.Authorization
  }
}

export {
  setAuthToken,
  restApi
}
