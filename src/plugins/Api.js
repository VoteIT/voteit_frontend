import Axios from 'axios'

export default {
  install (app) {
    app.config.globalProperties.$api = Axios.create({
      baseURL: 'http://localhost:8000/api/'
    })
  }
}
