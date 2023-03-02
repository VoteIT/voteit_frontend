import { ref } from 'vue'
import { Dictionary, last } from 'lodash'

import { uriToPayload } from '@/utils'
import hostname from '@/utils/hostname'
import { AlertLevel } from '@/composables/types'

import { isValidationErrorPayload, State } from './types'
import { DocumentVisibleEvent, openAlertEvent } from './events'
import DefaultMap from './DefaultMap'
import ProgressPromise from './ProgressPromise'

import type { BatchPayload, ChannelsConfig, ChannelsMessage, PydanticError, SubscribedPayload, SuccessMessage } from './types'

type SocketEventHandler = (event: MessageEvent | Event | CloseEvent) => void
export enum SocketEvent {
  Open = 'open',
  Close = 'close',
  Error = 'error',
  Message = 'message'
}

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'

const DEFAULT_CONFIG: ChannelsConfig = {
  timeout: 20_000 // 20 s, longer than server's 15 s
}
let heartbeatInterval: NodeJS.Timeout
const HEARTBEAT_MS = 30_000

export const socketState = ref(false)

export class ValidationError extends Error {
  errors: PydanticError[]

  constructor (msg: string, errors: PydanticError[]) {
    super(msg)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export function isValidationError (error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function parseSocketError (error: Error | ValidationError): Dictionary<string[]> {
  if (!isValidationError(error)) return {}
  const locErrors: Record<string, string[]> = {}
  for (const e of error.errors) {
    const loc = last(e.loc) as string // Should not be empty
    if (!(loc in locErrors)) locErrors[loc] = []
    locErrors[loc].push(e.msg)
  }
  return locErrors
}

function isSubscribedMessage (msg: ChannelsMessage<unknown>): msg is SuccessMessage<SubscribedPayload> {
  return msg.t === 'channel.subscribed'
}

class Socket {
  public active: boolean
  private callbacks: Map<string, (data: ChannelsMessage) => void>
  private typeListeners: Map<string, (data: ChannelsMessage) => void>
  private listeners: DefaultMap<string, Set<SocketEventHandler>>
  private ws?: WebSocket

  constructor () {
    this.active = false
    this.callbacks = new Map()
    this.typeListeners = new Map()
    this.listeners = new DefaultMap(() => new Set())
    // 's' == system
    this.registerTypeListener('s', ({ i, p, t }) => {
      switch (t) {
        case 's.ping':
          // Respond to server ping
          socket.respond('s.pong', i)
          break
        case 's.batch':
          this.handleBatchMessage(p as BatchPayload, i)
          break
      }
    })
  }

  // Batch messages allows sending a group of messages that are handled in the same tick,
  // to avoid triggering Vue component updates on each added object
  private handleBatchMessage ({ t, payloads }: BatchPayload, i: string | null) {
    const [contentType] = t.split('.')
    const listener = this.typeListeners.get(contentType)
    if (!listener) return console.warn(`No listener registered for batch message ${t}`)
    for (const p of payloads) {
      listener({ t, i, p })
    }
  }

  private createEventListener (eventName: SocketEvent): SocketEventHandler {
    return (event) => {
      for (const listener of this.listeners.get(eventName)) {
        listener(event)
      }
    }
  }

  public addEventListener (eventName: SocketEvent, listener: SocketEventHandler) {
    this.listeners.get(eventName).add(listener)
  }

  public removeEventListener (eventName: SocketEvent, listener: SocketEventHandler) {
    this.listeners.get(eventName).delete(listener)
  }

  public registerTypeListener (name: string, listener: (data: ChannelsMessage) => void) {
    this.typeListeners.set(name, listener)
  }

  public connect () {
    this.active = true
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${wsProtocol}//${hostname}/ws/`)

      this.ws.addEventListener(SocketEvent.Error, reject)
      this.ws.addEventListener(SocketEvent.Open, (evt) => {
        socketState.value = true
        resolve(evt)
      })
      this.ws.addEventListener(SocketEvent.Message, event => {
        this.heartbeat()
        const msg: ChannelsMessage = JSON.parse(event.data)
        // If there's a listener for message identifier
        if (msg.i) this.callbacks.get(msg.i)?.(msg)
        // If it's a subscribed response, handle any app_state
        if (isSubscribedMessage(msg)) msg.p.app_state?.forEach(this.handleTypeMessage.bind(this))
        // Else handle type message
        else this.handleTypeMessage(msg)
      })
      this.ws.addEventListener(SocketEvent.Close, () => {
        socketState.value = false
      })
      this.ws.onopen = this.createEventListener(SocketEvent.Open)
      this.ws.onmessage = this.createEventListener(SocketEvent.Message)
      this.ws.onerror = this.createEventListener(SocketEvent.Error)
      this.ws.onclose = this.createEventListener(SocketEvent.Close)
    })
  }

  private handleTypeMessage (msg: ChannelsMessage) {
    if (!msg.t) return
    const type = msg.t.split('.')[0]
    if (!this.typeListeners.has(type)) console.warn(`No handler for message of type '${type}'`)
    this.typeListeners.get(type)?.(msg)
  }

  public close () {
    // Unregister listeners here?
    this.active = false
    if (!this.ws) return
    this.ws.onopen = () => { throw new Error('Undead socket detected') }
    this.ws.onmessage = null
    this.ws.onerror = null
    this.ws.onclose = null
    this.ws.close()
  }

  /* Ping Pong */
  // Reset interval
  private heartbeat (restart = true) {
    clearInterval(heartbeatInterval)
    if (restart) heartbeatInterval = setTimeout(this.ping.bind(this), HEARTBEAT_MS)
  }

  // Ping server when socket has been quiet
  private async ping () {
    if (document.visibilityState !== 'visible') {
      DocumentVisibleEvent.once(this.ping.bind(this))
      return
    }
    try {
      await this.call('s.ping')
    } catch {
      this.heartbeat(false) // Stop pings
      socket.close() // This takes time to finish
      // Probably need to either wait for closure, or unregister everything connected to old socket connection before connecting again.
      socketState.value = false // Trigger reactivity straight away?
    }
  }
  /* End of Ping Pong */

  public get isOpen () {
    return this.active && this.ws?.readyState === WebSocket.OPEN
  }

  private assertOpen () {
    if (!this.active) throw new Error('Socket not activated')
    if (this.ws?.readyState !== WebSocket.OPEN) throw new Error('Socket closed')
  }

  public call<T> (type: string, payload?: object, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>>
  public call<T> (type: string, uri: string, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>>
  public call<T> (type: string, payloadOrUri?: string | object, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>> {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
    this.assertOpen()
    const myConfig: ChannelsConfig = { ...DEFAULT_CONFIG, ...(config || {}) }
    const messageId: string = sessionStorage.socketMessageCounter || '1'
    const payload = payloadOrUri && (typeof payloadOrUri === 'object'
      ? payloadOrUri
      : uriToPayload(payloadOrUri))
    this.ws?.send(JSON.stringify({
      t: type,
      p: payload,
      i: messageId
    }))
    sessionStorage.socketMessageCounter = Number(messageId) + 1
    return new ProgressPromise((resolve, reject, progress) => {
      let timeoutId: NodeJS.Timeout
      const setRejectTimeout = () => {
        if (!myConfig.timeout) return
        timeoutId = setTimeout(() => {
          this.callbacks.delete(messageId)
          if (myConfig.alertOnError) {
            openAlertEvent.emit({
              title: 'Socket error',
              text: 'Request timed out',
              level: AlertLevel.Error,
              sticky: true
            })
          }
          reject(new Error('Request timed out'))
        }, myConfig.timeout)
      }
      setRejectTimeout()

      this.callbacks.set(messageId, data => {
        clearTimeout(timeoutId)
        switch (data.s) {
          case State.Failed:
            this.callbacks.delete(messageId)
            if (myConfig.alertOnError) {
              openAlertEvent.emit({
                title: 'Socket error',
                text: data.p.msg,
                level: AlertLevel.Error,
                sticky: true
              })
            }
            reject(
              isValidationErrorPayload(data.p)
                ? new ValidationError(data.p.msg, data.p.errors)
                : new Error(data.p.msg)
            )
            break
          case State.Waiting:
          case State.Queued:
          case State.Running:
            // If we get progress, we reset timeout watcher
            setRejectTimeout()
            progress(data.p)
            break
          case State.Success:
            this.callbacks.delete(messageId)
            resolve(data as SuccessMessage<T>)
            break
          default: // Should never happen
            this.callbacks.delete(messageId)
            reject(new Error(`Unknown socket state: ${data}`))
        }
      })
    })
  }

  public send (type: string, payloadOrUri: string | object) {
    // Does not register a response listener
    this.assertOpen()
    const payload = typeof payloadOrUri === 'object'
      ? payloadOrUri
      : uriToPayload(payloadOrUri)
    this.ws?.send(JSON.stringify({
      t: type,
      p: payload
    }))
  }

  public respond (type: string, id: string | null, state: State = State.Success, payload?: object) {
    this.assertOpen()
    this.ws?.send(JSON.stringify({
      t: type,
      i: id,
      p: payload,
      s: state
    }))
  }
}

export const socket = new Socket()
