import { ProgressPromise, Socket } from '@/utils'

const socket = new Socket('token') // TODO Make this shit reusable somehow
const subscriptions = {}

socket.addEventListener({
  message (event) {
    const data = JSON.parse(event.data)
    const baseType = data.t.split('.')[0]
    // Do callback for every registered subscription matching first part
    Object.keys(subscriptions)
      .filter(uri => uri.split('/')[0] === baseType)
      .forEach(uri => {
        for (const callback of subscriptions[uri]) {
          callback(data)
        }
      })
  }
})

export default {
  install (app) {
    app.config.globalProperties.$objects = {
      subscribe (uri, callback) {
        if (typeof callback !== 'function') {
          throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
        }

        if (subscriptions[uri] === undefined) {
          subscriptions[uri] = new Set()
        }
        if (!subscriptions[uri].size) {
          socket.send('object.subscribe', uri)
        }
        subscriptions[uri].add(callback)
      },

      leave (uri, callback) {
        subscriptions[uri].delete(callback)
        if (!subscriptions[uri].size) {
          socket.send('object.leave', uri)
        }
      },

      get (uri) {
        // Testing code
        return socket.call(uri)
      },

      post (uri) {
        // TODO
        return new ProgressPromise()
      },

      put (uri) {
        // TODO
        return new ProgressPromise()
      },

      delete (uri) {
        // TODO
        return new ProgressPromise()
      },

      schema (type) {
        return new Promise((resolve, reject) => {
          socket.call('schema.get', { message_type: type })
            .then(resolve)
            .catch(reject)
        })
      }
    }
  }
}
