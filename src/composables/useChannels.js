import { Socket, emitter } from '@/utils'
import { ref } from 'vue'

const DEFAULT_CONFIG = {
  alertOnError: true
}

const socket = new Socket()
const socketState = ref(false)
const subscriptions = new Map()
const updateHandlers = new Map()
const ignoreContentTypes = new Set(['testing', 'channel', 'response'])

socket.addEventListener('message', event => {
  const data = JSON.parse(event.data)
  if (data.t && data.t.startsWith('error.')) {
    let msg = data.p.msg
    if (data.p.errors && data.p.errors.length) {
      msg = data.p.errors
        .map(e => e.msg)
        .join('\n')
    }
    emitter.emit('alert-open', {
      title: data.t,
      text: msg,
      level: 'warning'
    })
    return
  }
  const [ct] = data.t.split('.')
  if (updateHandlers.has(ct)) {
    updateHandlers.get(ct)(data)
  } else if (!ignoreContentTypes.has(ct)) {
    console.log('No registered update handler for content type', ct)
  }
})

// Send all subscription messages on connect
socket.addEventListener('open', _ => {
  socketState.value = true
  for (const [uri, set] of subscriptions.entries()) {
    if (set.size) {
      socket.send('channel.subscribe', uri)
    }
  }
})

socket.addEventListener('close', _ => {
  socketState.value = false
})

export default function useChannels (contentType, moduleConfig) {
  moduleConfig = Object.assign({}, DEFAULT_CONFIG, moduleConfig || {})
  function connect (token) {
    return socket.connect(token)
  }

  function disconnect () {
    socket.close()
  }

  function registerUpdateHandler (ct, fn) {
    console.log('registering update handler for', ct)
    updateHandlers.set(ct, fn)
  }

  function subscribe (uri) {
    if (!subscriptions.has(uri)) {
      subscriptions.set(uri, new Set())
    }
    if (!subscriptions.get(uri).size && socket.isOpen) {
      socket.send('channel.subscribe', uri)
    }
    subscriptions.get(uri).add(this)
  }

  function leave (uri) {
    subscriptions.get(uri).delete(this)
    if (!subscriptions.get(uri).size && socket.isOpen) {
      socket.send('channel.leave', uri)
    }
  }

  // Wrap call and handle request errors (Timeout only?)
  function call (uri, data, config) {
    config = Object.assign({}, moduleConfig, config || {})
    return socket.call(uri, data, config)
  }

  function get (uri, config) {
    return call(uri, undefined, config)
  }

  function post (uri, data, config) {
    return call(uri, data, config)
  }

  function checkCType (methodName) {
    if (!contentType) {
      throw new Error(`Instantiate using useChannels(contentType) to use ${methodName}`)
    }
  }

  function add (contextPk, kwargs, config) {
    checkCType('add')
    return call(`${contentType}.add`, { pk: contextPk, kwargs }, config)
  }

  function change (pk, kwargs, config) {
    checkCType('change')
    return call(`${contentType}.change`, { pk, kwargs }, config)
  }

  function _delete (pk, config) {
    checkCType('delete')
    return call(`${contentType}.delete`, { pk }, config)
  }

  function outgoingSchema (type) {
    return post('schema.get_outgoing', { message_type: type })
  }

  function incomingSchema (type) {
    return post('schema.get_incoming', { message_type: type })
  }

  return {
    socket,
    socketState,
    registerUpdateHandler,
    connect,
    disconnect,
    subscribe,
    leave,
    get,
    post,
    add,
    change,
    delete: _delete,
    outgoingSchema,
    incomingSchema
  }
}
