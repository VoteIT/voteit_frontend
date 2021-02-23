import { ref } from 'vue'

import { DefaultMap, Socket } from '@/utils'
import { Payload, SuccessMessage } from '@/utils/types'

import { ChannelConfig } from './types'
import { BaseContent } from '@/contentTypes/types'

type LeaveHandler = (uriOrPk: string | number) => void
type UpdateHandler = (message: SuccessMessage) => void
type MethodHandler = (payload: Payload) => void // FIXME Payload?

const DEFAULT_CONFIG: ChannelConfig = {
  alertOnError: true,
  leaveDelay: 10000 // Delay before leaving channel in ms
}

const socket = new Socket()
const socketState = ref(false)
// Map version code does nothing sane. Remove
// const subscriptions = new DefaultMap(_ => new Set())
const subscriptions = new Set<string>()
const leaveTimeouts = new Map<string, number>()
const updateHandlers = new Map<string, UpdateHandler>()
const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
const methodHanders = new DefaultMap<string, Map<string, MethodHandler>>(() => new Map())
const ignoreContentTypes = new Set(['testing', 'channel', 'response'])

function handleMessage (data: SuccessMessage) {
  const [contentType, method] = data.t.split('.')
  const updateHandler = updateHandlers.get(contentType)
  // General update handler takes precedence over other handlers
  if (updateHandler) {
    updateHandler(data)
    return
  }
  const handler = methodHanders.get(method).get(contentType)
  if (handler) {
    // Method handler only needs payload
    handler(data.p)
  } else if (!ignoreContentTypes.has(contentType)) {
    console.log('No registered update handler for content type', contentType)
  }
}

socket.addEventListener('message', event => {
  if ('data' in event) {
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
  }
})

async function subscribeChannel (uri: string) {
  return socket.call('channel.subscribe', uri)
    .then(({ p }: { p: Payload }) => {
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

export default function useChannels (contentType?: string, moduleConfig?: ChannelConfig) {
  moduleConfig = { ...DEFAULT_CONFIG, ...(moduleConfig || {}) }
  function connect (token: string) {
    return socket.connect(token)
  }

  function disconnect () {
    socket.close()
  }

  function onUpdate (this: any, fn: UpdateHandler) {
    // Will take precedence over and block .onChanged(), etc
    console.log('registering update handler for', contentType)
    updateHandlers.set(getCType('onUpdate'), fn)
    return this
  }

  function onLeave (this: any, fn: LeaveHandler) {
    leaveHandlers.get(getCType('onLeave')).push(fn)
    return this
  }

  function on (this: any, method: string, fn: MethodHandler, override = true) {
    const contentType = getCType('on' + method[0].toUpperCase() + method.slice(1))
    const ctHandlers = methodHanders.get(method)
    if (override || !ctHandlers.has(contentType)) {
      methodHanders.get(method).set(contentType, fn)
    }
    return this
  }

  const onAdded = (fn: MethodHandler) => on('added', fn)
  const onDeleted = (fn: MethodHandler) => on('deleted', fn)
  const onStatus = (fn: MethodHandler) => on('status', fn)

  function onChanged (fn: MethodHandler) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    on('added', fn, false)
    return on('changed', fn)
  }

  function updateMap (this: any, map: Map<number, Payload>, transform = (value: Payload) => value) {
    // Convenience method to set onChanged and onDeleted to update Map object.
    onChanged((item: Payload) => map.set(item.pk, transform(item)))
    onDeleted((item: Payload) => map.delete(item.pk))
    return this
  }

  function getUri (uriOrPk: string | number): string {
    // Allow channel subscriptions using contentType[/pk]
    switch (typeof uriOrPk) {
      case 'undefined':
        return getCType('subscribe')
      case 'number':
        return `${getCType('subscribe')}/${uriOrPk}`
    }
    return uriOrPk
  }

  async function subscribe (uriOrPk: string | number, fail = false) {
    if (uriOrPk) {
      const uri = getUri(uriOrPk)
      clearTimeout(leaveTimeouts.get(uri))
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

  async function leave (uriOrPk: string | number, config?: ChannelConfig) {
    if (uriOrPk) {
      const uri = getUri(uriOrPk)
      clearTimeout(leaveTimeouts.get(uri))
      if (subscriptions.has(uri)) {
        const myConfig: ChannelConfig = { ...DEFAULT_CONFIG, ...(config || {}) }
        return new Promise(resolve => {
          // Will not resolve if canceled...
          leaveTimeouts.set(uri, setTimeout(() => {
            // Delete from subscriptions when sending unsubscribe request.
            // New subscribtions will clear this timeout.
            subscriptions.delete(uri)
            if (socket.isOpen) {
              socket.send('channel.leave', uri)
            }
            // Call onLeave handlers... (Does not wait for response...)
            const [contentType] = uri.split('/')
            for (const cb of leaveHandlers.get(contentType) || []) {
              cb(uriOrPk)
            }
            resolve(true)
          }, myConfig.leaveDelay))
        })
      }
    } else {
      console.error(uriOrPk, config)
      throw new Error('Channel leave function requires channel name or primary key')
    }
  }

  // Wrap call and handle request errors (Timeout only?)
  function call (uri: string, data: object, config?: ChannelConfig) {
    config = Object.assign({}, moduleConfig, config || {})
    return socket.call(uri, data, config)
  }

  // function get (uri, config) {
  //   return call(uri, undefined, config)
  // }

  function post (uri: string, data: object, config?: ChannelConfig) {
    return call(uri, data, config)
  }

  function getCType (methodName?: string): string {
    if (typeof contentType !== 'string') {
      throw new Error(`Instantiate using useChannels(contentType) to use ${methodName || 'channels'}`)
    }
    return contentType
  }

  function methodCall (method: string, data: object, config?: ChannelConfig) {
    return call(`${getCType()}.${method}`, data, config)
  }

  const get = (pk: number, config?: ChannelConfig) => methodCall('get', { pk }, config)
  const add = (contextPk: number, kwargs: object, config?: ChannelConfig) => methodCall('add', { pk: contextPk, kwargs }, config)
  const change = (pk: number, kwargs: object, config?: ChannelConfig) => methodCall('change', { pk, kwargs }, config)
  const _delete = (pk: number, config?: ChannelConfig) => methodCall('delete', { pk }, config)

  function outgoingSchema (type: string) {
    return post('schema.get_outgoing', { message_type: type })
  }

  function incomingSchema (type: string) {
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
