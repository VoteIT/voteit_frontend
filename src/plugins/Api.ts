import { restApi } from '../utils'

export default {
  install (app: any) {
    app.config.globalProperties.$api = restApi
  }
}
