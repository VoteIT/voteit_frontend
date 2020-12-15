import Axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/'
const restApi = Axios.create({
  baseURL: BASE_URL
})

export {
  restApi
}
