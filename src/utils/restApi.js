import Axios from 'axios'

const BaseUrls = {
  production: '/api/',
  development: 'http://localhost:8000/api/'
}

const BASE_URL = BaseUrls[process.env.NODE_ENV]
export default Axios.create({
  baseURL: BASE_URL
})
