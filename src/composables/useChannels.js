import { DefaultMap, Socket } from '@/utils'
import { ref } from 'vue'

const DEFAULT_CONFIG = {
  alertOnError: true,
  leaveDelay: 10000 // Delay before leaving channel in ms
}

const socket = new Socket()
const socketState = ref(false)
// Map version code does nothing sane. Remove
// const subscriptions = new DefaultMap(_ => new Set())
const subscriptions = new Set()
const leaveTimeouts = {}
const updateHandlers = new Map()
const leaveHandlers = new DefaultMap(_ => [])
const methodHanders = {}
const ignoreContentTypes = new Set(['testing', 'channel', 'response'])

function handleMessage (data) {
  const [contentType, method] = data.t.split('.')
  // General update handler takes precedence over other handlers
  if (updateHandlers.has(contentType)) {
    updateHandlers.get(contentType)(data)
    return
  }
  const handler = methodHanders[method] && methodHanders[method][contentType]
  if (handler) {
    // Method handler only needs payload
    handler(data.p)
  } else if (!ignoreContentTypes.has(contentType)) {
    console.log('No registered update handler for content type', contentType)
  }
}

socket.addEventListener('message', event => {
  const data = JSON.parse(event.data)
  // Moved to utils Socket for now
  // if (data.t && data.t.startsWith('error.')) {
  //   let msg = data.p.msg
  //   if (data.p.errors && data.p.errors.length) {
  //     msg = data.p.errors
  //       .map(e => e.msg)
  //       .join('\n')
  //   }
  //   emitter.emit('alert-open', {
  //     title: data.t,
  //     text: msg,
  //     level: 'warning'
  //   })
  //   return
  // }
  handleMessage(data)
})

function subscribeChannel (uri) {
  return socket.call('channel.subscribe', uri)
    .then(({ p }) => {
      if (p.app_state) p.app_state.forEach(handleMessage)
    })
}

// Send all subscription messages on connect
socket.addEventListener('open', _ => {
  socketState.value = true
  for (const uri of subscriptions.values()) {
    subscribeChannel(uri)
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

  function onUpdate (fn) {
    // Will take precedence over and block .onChanged(), etc
    checkCType('onUpdate')
    console.log('registering update handler for', contentType)
    updateHandlers.set(contentType, fn)
    return this
  }

  function onLeave (fn) {
    checkCType('onLeave')
    leaveHandlers.get(contentType).push(fn)
    return this
  }

  function on (method, fn) {
    checkCType('on' + method[0].toUpperCase() + method.slice(1))
    if (!methodHanders[method]) methodHanders[method] = {}
    methodHanders[method][contentType] = fn
    return this
  }

  const onAdded = fn => on('added', fn)
  const onDeleted = fn => on('deleted', fn)
  const onStatus = fn => on('status', fn)

  function onChanged (fn) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    on('changed', fn)
    if (!methodHanders.added || !methodHanders.added[contentType]) {
      onAdded(fn)
    }
    return this
  }

  function updateMap (map) {
    // Convenience method to set onChanged and onDeleted to update Map object.
    onChanged(item => map.set(item.pk, item))
    onDeleted(item => map.delete(item.pk))
    return this
  }

  function getUri (uriOrPk) {
    // Allow channel subscriptions using contentType[/pk]
    switch (typeof uriOrPk) {
      case 'undefined':
        checkCType('subscribe')
        return contentType
      case 'number':
        checkCType('subscribe')
        return `${contentType}/${uriOrPk}`
    }
    return uriOrPk
  }

  async function subscribe (uriOrPk, fail = false) {
    if (uriOrPk) {
      const uri = getUri(uriOrPk)
      clearTimeout(leaveTimeouts[uri])
      if (!subscriptions.has(uri)) {
        subscriptions.add(uri)
        if (socket.isOpen) {
          return subscribeChannel(uri)
        } else if (fail) {
          return Promise.reject(new Error('Socket closed. Cannot subscribe.'))
        }
      }
    }
    return Promise.resolve()
  }

  function leave (uriOrPk, config) {
    if (uriOrPk) {
      const uri = getUri(uriOrPk)
      clearTimeout(leaveTimeouts[uri])
      if (subscriptions.has(uri)) {
        config = Object.assign({}, moduleConfig, config || {})
        leaveTimeouts[uri] = setTimeout(_ => {
          // Delete from subscriptions when sending unsubscribe request.
          // New subscribtions will clear this timeout.
          subscriptions.delete(uri)
          if (socket.isOpen) {
            socket.send('channel.leave', uri)
          }
          // Call onLeave handlers...
          leaveHandlers.get(contentType).forEach(cb => cb(uriOrPk))
        }, config.leaveDelay)
      }
    }
  }

  // Wrap call and handle request errors (Timeout only?)
  function call (uri, data, config) {
    config = Object.assign({}, moduleConfig, config || {})
    return socket.call(uri, data, config)
  }

  // function get (uri, config) {
  //   return call(uri, undefined, config)
  // }

  function post (uri, data, config) {
    return call(uri, data, config)
  }

  function checkCType (methodName) {
    if (!contentType) {
      throw new Error(`Instantiate using useChannels(contentType) to use ${methodName}`)
    }
  }

  function methodCall (method, data, config) {
    checkCType(method)
    return call(`${contentType}.${method}`, data, config)
  }

  const get = (pk, config) => methodCall('get', { pk }, config)
  const add = (contextPk, kwargs, config) => methodCall('add', { pk: contextPk, kwargs }, config)
  const change = (pk, kwargs, config) => methodCall('change', { pk, kwargs }, config)
  const _delete = (pk, config) => methodCall('delete', { pk }, config)

  function outgoingSchema (type) {
    return post('schema.get_outgoing', { message_type: type })
  }

  function incomingSchema (type) {
    return post('schema.get_incoming', { message_type: type })
  }

  return {
    socket,
    socketState,
    onUpdate,
    onLeave,
    on,
    onAdded,
    onChanged,
    onDeleted,
    onStatus,
    updateMap,
    connect,
    disconnect,
    subscribe,
    leave,
    methodCall,
    get,
    post,
    add,
    change,
    delete: _delete,
    outgoingSchema,
    incomingSchema
  }
}
