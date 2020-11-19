import { restApi } from '../utils'

export default {
  install (app) {
    app.config.globalProperties.$api = restApi
  }
}
