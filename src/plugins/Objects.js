import { Socket } from '@/utils'

const socket = new Socket('token') // TODO Make this reusable somehow
const subscriptions = {}
let objectUpdateHandler

socket.addEventListener('message', event => {
  const data = JSON.parse(event.data)
  objectUpdateHandler(data)
  // const baseType = data.t.split('.')[0]
  // Do callback for every registered subscription matching first part
  // Object.keys(subscriptions)
  //   // .filter(uri => uri.split('/')[0] === baseType)
  //   .forEach(uri => {
  //     for (const callback of subscriptions[uri]) {
  //       callback(data)
  //     }
  //   })
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
      subscribe (uri, component) {
        if (!objectUpdateHandler) {
          // On first subscribe, set up update handler.
          objectUpdateHandler = payload => { component.$store.dispatch('updateObject', payload) }
        }
        if (typeof component !== 'object') {
          throw new TypeError(`Expected an \`Object\`, got \`${typeof component}\``)
        }

        if (subscriptions[uri] === undefined) {
          subscriptions[uri] = new Set()
        }
        if (!subscriptions[uri].size && socket.isOpen) {
          socket.send('object.subscribe', uri)
        }
        subscriptions[uri].add(component)
      },

      leave (uri, component) {
        subscriptions[uri].delete(component)
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
        return Promise.reject(new Error('not implemented'))
      },

      delete (uri, config) {
        // TODO
        return Promise.reject(new Error('not implemented'))
      },

      schema (type) {
        return socket.call('schema.get', { message_type: type })
      }
    }
  }
}
