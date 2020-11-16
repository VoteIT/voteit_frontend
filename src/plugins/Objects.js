import { Socket } from '@/utils'

const socket = new Socket('token') // TODO Make this shit reusable somehow
const subscriptions = {}

socket.addEventListener('message', event => {
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
})

export default {
  install (app) {
    // Send all subscription messages on connect
    socket.addEventListener('open', () => {
      Object.keys(subscriptions)
        .filter(uri => subscriptions[uri].size)
        .forEach(uri => {
          socket.send('object.subscribe', uri)
        })
    })

    app.config.globalProperties.$socket = socket
    app.config.globalProperties.$objects = {
      subscribe (uri, callback) {
        if (typeof callback !== 'function') {
          throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
        }

        if (subscriptions[uri] === undefined) {
          subscriptions[uri] = new Set()
        }
        if (!subscriptions[uri].size && socket.isOpen) {
          socket.send('object.subscribe', uri)
        }
        subscriptions[uri].add(callback)
      },

      leave (uri, callback) {
        subscriptions[uri].delete(callback)
        if (!subscriptions[uri].size && socket.isOpen) {
          socket.send('object.leave', uri)
        }
      },

      get (uri, config) {
        return socket.call(uri, undefined, config)
      },

      post (uri, data, config) {
        return socket.call(uri, data, config)
      },

      put (uri, data, config) {
        // TODO
        return Promise.reject(new Error('not imlemented'))
      },

      delete (uri, config) {
        // TODO
        return Promise.reject(new Error('not imlemented'))
      },

      schema (type) {
        return socket.call('schema.get', { message_type: type })
      }
    }
  }
}
