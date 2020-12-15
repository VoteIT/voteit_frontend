import { emitter } from '../utils'

export default {
  install (app) {
    Object.assign(app.config.globalProperties, {
      $alert: alert => emitter.emit('alert-open', alert)
    })
  }
}
