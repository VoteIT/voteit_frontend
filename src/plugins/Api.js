import Axios from 'axios'

// TODO Get this somewaysomehow
const adminToken = '797cd6e0103d0a7e38d0a791e04bf4549347c4b5'

export default {
  install (app) {
    app.config.globalProperties.$api = Axios.create({
      baseURL: 'http://localhost:8000/api/',
      headers: {
        Authorization: 'Token ' + adminToken
      }
    })
  }
}
