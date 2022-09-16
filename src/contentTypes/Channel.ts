import { SubscribedPayload, SuccessMessage } from '@/utils/types'
import DefaultMap from '@/utils/DefaultMap'

import { ChannelConfig, SchemaType } from './types'
import { socket, SocketEvent } from '@/utils/Socket'

type LeaveHandler = (uriOrPk: string | number) => void

const DEFAULT_CONFIG: ChannelConfig = {
  alertOnError: true,
  leaveDelay: 10_000 // Delay before leaving channel in ms
}

const leaveTimeouts = new Map<string, number>()
const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
const subscriptions = new Set<string>()

function subscribeChannel (uri: string, config: ChannelConfig) {
  return socket.call<SubscribedPayload>('channel.subscribe', uri, config)
}

// Send all subscription messages on connect
socket.addEventListener(SocketEvent.Open, () => {
  for (const uri of subscriptions) {
    subscribeChannel(uri, DEFAULT_CONFIG)
  }
})

export default class Channel {
  public name: string
  private config: ChannelConfig

  constructor (name: string, config?: ChannelConfig) {
    this.name = name
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
  }

  public onLeave (fn: LeaveHandler) {
    leaveHandlers.get(this.name).push(fn)
    return this
  }

  public getUri (uriOrPk?: string | number): string {
    // Allow channel subscriptions using contentType[/pk]
    switch (typeof uriOrPk) {
      case 'undefined':
        return this.name
      case 'number':
        return `${this.name}/${uriOrPk}`
    }
    return uriOrPk
  }

  public async subscribe (uriOrPk: string | number, fail = false) {
    const uri = this.getUri(uriOrPk)
    clearTimeout(leaveTimeouts.get(uri))
    if (subscriptions.has(uri)) return
    subscriptions.add(uri)
    if (socket.isOpen) return subscribeChannel(uri, this.config)
    if (fail) throw new Error('Socket closed. Cannot subscribe.')
  }

  private performLeave (uri: string): void {
    // Delete from subscriptions when sending unsubscribe request.
    subscriptions.delete(uri)
    if (socket.isOpen) {
      socket.send('channel.leave', uri)
    }
    // Call onLeave handlers... (Does not wait for response...)
    const [contentType] = uri.split('/')
    for (const cb of leaveHandlers.get(contentType) || []) {
      cb(uri)
    }
  }

  public async leave (uri: string, config?: ChannelConfig): Promise<void>
  public async leave (pk: number, config?: ChannelConfig): Promise<void>
  public async leave (uriOrPk: string | number, config?: ChannelConfig): Promise<void> {
    const myConfig: ChannelConfig = { ...this.config, ...(config || {}) }
    const uri = this.getUri(uriOrPk)
    clearTimeout(leaveTimeouts.get(uri))
    if (!subscriptions.has(uri)) return
    if (!myConfig.leaveDelay) return this.performLeave(uri)

    return new Promise(resolve => {
      // Will not resolve if canceled...
      leaveTimeouts.set(uri, setTimeout(() => {
        // New subscribtions will clear this timeout.
        this.performLeave(uri)
        resolve()
      }, myConfig.leaveDelay))
    })
  }

  // Wrap call and handle request errors (Timeout only?)
  private call<RT=unknown> (uri: string, data?: object, config?: ChannelConfig) {
    config = { ...this.config, ...(config || {}) }
    return socket.call<RT>(uri, data, config)
  }

  // eslint-disable-next-line camelcase
  public getSchema (message_type: string, type: SchemaType = SchemaType.Incoming): Promise<SuccessMessage<{ message_schema: object }>> {
    // eslint-disable-next-line camelcase
    return this.call(`schema.get_${type}`, { message_type })
  }
}
