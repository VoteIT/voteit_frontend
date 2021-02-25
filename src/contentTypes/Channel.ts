import { ref } from 'vue'

import { DefaultMap, Socket } from '@/utils'
import { SuccessMessage } from '@/utils/types'

import { ChannelConfig, SchemaType } from './types'

type LeaveHandler = (uriOrPk: string | number) => void
type UpdateHandler<T> = (message: SuccessMessage) => void
type MethodHandler<T> = (item: T) => void

const DEFAULT_CONFIG: ChannelConfig = {
  alertOnError: true,
  leaveDelay: 10000 // Delay before leaving channel in ms
}

const socket = new Socket()
export const socketState = ref(false)
const subscriptions = new Set<string>()
const leaveTimeouts = new Map<string, number>()
const updateHandlers = new Map<string, UpdateHandler<any>>()
const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
const methodHanders = new DefaultMap<string, Map<string, MethodHandler<any>>>(() => new Map())
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
    handleMessage(JSON.parse(event.data))
  }
})

async function subscribeChannel (uri: string) {
  return socket.call('channel.subscribe', uri)
    .then(({ p }: { p: any }) => {
      if (p.app_state) p.app_state.forEach(handleMessage)
    })
}

// Send all subscription messages on connect
socket.addEventListener('open', () => {
  socketState.value = true
  for (const uri of subscriptions.values()) {
    subscribeChannel(uri)
  }
})

socket.addEventListener('close', () => {
  socketState.value = false
})

export default class Channel<T> {
  private _contentType?: string
  private config: ChannelConfig

  get contentType (): string {
    if (typeof this._contentType === 'string') return this._contentType
    throw new Error('Instantiate using useChannels(contentType) to use this method')
  }

  get socketState () {
    return socketState
  }

  constructor (contentType?: string, config?: ChannelConfig) {
    this._contentType = contentType
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
  }

  connect (token?: string) {
    return socket.connect(token)
  }

  disconnect () {
    socket.close()
  }

  onUpdate (fn: UpdateHandler<T>) {
    // Will take precedence over and block .onChanged(), etc
    console.log('registering update handler for', this.contentType)
    updateHandlers.set(this.contentType, fn)
    return this
  }

  onLeave (fn: LeaveHandler) {
    leaveHandlers.get(this.contentType).push(fn)
    return this
  }

  on (this: any, method: string, fn: MethodHandler<T>, override = true): Channel<T> {
    const ctHandlers = methodHanders.get(method)
    if (override || !ctHandlers.has(this.contentType)) {
      methodHanders.get(method).set(this.contentType, fn)
    }
    return this
  }

  onAdded = (fn: MethodHandler<T>) => this.on('added', fn)
  onDeleted = (fn: MethodHandler<T>) => this.on('deleted', fn)
  onStatus = (fn: MethodHandler<T>) => this.on('status', fn)

  onChanged (fn: MethodHandler<T>) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    return this.on('added', fn, false)
      .on('changed', fn)
  }

  updateMap (this: any, map: Map<number, T>, transform = (value: T) => value): Channel<T> {
    // Convenience method to set onChanged and onDeleted to update Map object.
    return this.onChanged((item: any) => map.set(item.pk, transform(item as T)))
      .onDeleted((item: any) => map.delete(item.pk))
  }

  private getUri (uriOrPk?: string | number): string {
    // Allow channel subscriptions using contentType[/pk]
    switch (typeof uriOrPk) {
      case 'undefined':
        return this.contentType
      case 'number':
        return `${this.contentType}/${uriOrPk}`
    }
    return uriOrPk
  }

  async subscribe (uriOrPk: string | number, fail = false) {
    if (uriOrPk) {
      const uri = this.getUri(uriOrPk)
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

  async leave (uriOrPk: string | number, config?: ChannelConfig) {
    if (uriOrPk) {
      const uri = this.getUri(uriOrPk)
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
  call (uri: string, data?: object, config?: ChannelConfig) {
    config = { ...this.config, ...(config || {}) }
    return socket.call(uri, data, config)
  }

  post (uri: string, data?: object, config?: ChannelConfig) {
    return this.call(uri, data, config)
  }

  methodCall (method: string, data: object, config?: ChannelConfig) {
    return this.call(`${this.contentType}.${method}`, data, config)
  }

  get = (pk: number, config?: ChannelConfig) => this.methodCall('get', { pk }, config)
  add = (contextPk: number, kwargs: object, config?: ChannelConfig) => this.methodCall('add', { pk: contextPk, kwargs }, config)
  change = (pk: number, kwargs: object, config?: ChannelConfig) => this.methodCall('change', { pk, kwargs }, config)
  delete = (pk: number, config?: ChannelConfig) => this.methodCall('delete', { pk }, config)

  getSchema (name: string, type = SchemaType.Incoming) {
    return this.post('schema.get_' + type, { message_type: name })
  }
}
