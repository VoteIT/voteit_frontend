import Axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/'
export default Axios.create({
  baseURL: BASE_URL
})
