import restApi from '@/utils/restApi'

export default {
  install (app: any) {
    app.config.globalProperties.$api = restApi
  }
}
