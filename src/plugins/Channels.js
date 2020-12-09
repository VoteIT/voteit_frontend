import { Socket } from '@/utils'

const socket = new Socket()
const subscriptions = {}
let objectUpdateHandler

socket.addEventListener('message', event => {
  if (objectUpdateHandler) {
    const data = JSON.parse(event.data)
    objectUpdateHandler(data)
  } else {
    console.log('Got socket message before subscribed to channel')
  }
})

export default {
  install (app) {
    // Send all subscription messages on connect
    socket.addEventListener('open', () => {
      Object.keys(subscriptions)
        .filter(uri => subscriptions[uri].size)
        .forEach(uri => {
          socket.send('channel.subscribe', uri)
        })
    })

    app.config.globalProperties.$socket = socket
    app.config.globalProperties.$channels = {
      connect (token) {
        return socket.connect(token)
      },

      disconnect () {
        socket.close()
      },

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
          socket.send('channel.subscribe', uri)
        }
        subscriptions[uri].add(component)
      },

      leave (uri, component) {
        subscriptions[uri].delete(component)
        if (!subscriptions[uri].size && socket.isOpen) {
          socket.send('channel.leave', uri)
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

      outgoing_schema (type) {
        return socket.call('schema.get_outgoing', { message_type: type })
      },
      incoming_schema (type) {
        return socket.call('schema.get_incoming', { message_type: type })
      }
    }
  }
}
