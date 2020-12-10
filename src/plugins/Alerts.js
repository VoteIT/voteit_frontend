import { emitter } from '../utils'

export default {
  install (app) {
    Object.assign(app.config.globalProperties, {
      $alert: alert => emitter.emit('alert-open', alert),
      $apiError: ({ response, request }) => {
        if (response) {
          const title = `HTTP ${response.status}`
          let text = 'Unknown error'
          let sticky = false
          // Default strings from response.data, unless special cases below
          if (typeof response.data === 'string') {
            text = response.data
          } else if (typeof response.data === 'object') {
            text = JSON.stringify(response.data)
          }
          switch (response.status) {
            case 500:
              text = 'Server error'
              break
            case 400:
              sticky = true
              break
          }
          emitter.emit('alert-open', {
            title,
            text,
            sticky,
            level: 'error'
          })
        } else {
          emitter.emit('alert-open', {
            title: 'Error',
            text: 'No response from server',
            level: 'error'
          })
        }
      }
    })
  }
}
