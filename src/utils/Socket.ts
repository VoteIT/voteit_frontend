import { uriToPayload, ProgressPromise, DefaultMap, openAlertEvent } from '@/utils'
import hostname from '@/utils/hostname'
import { ChannelsConfig, ChannelsMessage, State } from './types'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'

type SocketEventHandler = (event: MessageEvent | Event | CloseEvent) => void

const DEFAULT_CONFIG: ChannelsConfig = {
  timeout: 5000 // 5s
}
const STATE = {
  SUCCESS: 's',
  FAILED: 'f',
  WAITING: 'w',
  RUNNING: 'r'
}
const EVENTS = ['open', 'close', 'error', 'message']

export default class Socket {
  active: boolean
  callbacks: Map<string, (data: ChannelsMessage) => void>
  listeners: DefaultMap<string, Set<SocketEventHandler>>
  token?: string
  _ws?: WebSocket

  constructor () {
    this.active = false
    this.callbacks = new Map()
    this.listeners = new DefaultMap(() => new Set())
  }

  _createEventListener (name: string): SocketEventHandler {
    return (event) => {
      for (const listener of this.listeners.get(name)) {
        listener(event)
      }
    }
  }

  addEventListener (eventName: string, listener: SocketEventHandler) {
    this.listeners.get(eventName).add(listener)
  }

  removeEventListener (eventName: string, listener: SocketEventHandler) {
    this.listeners.get(eventName).delete(listener)
  }

  connect (token?: string) {
    // Save token is supplied (usually first call)
    if (token) {
      this.token = token
    }
    if (!this.token) {
      throw Error('Socket needs a token to connect')
    }
    this.active = true
    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(`${wsProtocol}//${hostname}/ws/${this.token}/`)

      this._ws.addEventListener('error', reject)
      this._ws.addEventListener('open', resolve)
      this._ws.addEventListener('message', event => {
        const data: ChannelsMessage = JSON.parse(event.data)
        const cb = this.callbacks.get(data.i)
        cb && cb(data)
      })
      for (const event of EVENTS) {
        this._ws.addEventListener(event, this._createEventListener(event))
      }
    })
  }

  close () {
    delete this.token
    this._ws && this._ws.close()
    this.active = false
  }

  get isOpen () {
    return this.active && this._ws && this._ws.readyState === WebSocket.OPEN
  }

  call (type: string, payloadOrUri?: string | object, config?: ChannelsConfig): ProgressPromise<ChannelsMessage> {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
    const myConfig: ChannelsConfig = { ...DEFAULT_CONFIG, ...(config || {}) }
    if (this.isOpen) {
      const messageId = sessionStorage.socketMessageCounter || '1'
      const payload = payloadOrUri && (typeof payloadOrUri === 'object'
        ? payloadOrUri
        : uriToPayload(payloadOrUri))
      this._ws && this._ws.send(JSON.stringify({
        t: type,
        p: payload,
        i: messageId
      }))
      sessionStorage.socketMessageCounter = Number(messageId) + 1
      return new ProgressPromise((resolve, reject, progress) => {
        let timeoutId: number
        const setRejectTimeout = () => {
          if (myConfig.timeout) {
            timeoutId = setTimeout(() => {
              this.callbacks.delete(messageId)
              if (myConfig.alertOnError) {
                openAlertEvent.emit({
                  title: 'Socket error',
                  text: 'Request timed out',
                  level: 'error',
                  sticky: true
                })
              }
              reject(new Error('Request timed out'))
            }, myConfig.timeout)
          }
        }
        setRejectTimeout()

        this.callbacks.set(messageId, data => {
          if (data.i === messageId) {
            clearTimeout(timeoutId)
            switch (data.s) {
              case State.Failed:
                this.callbacks.delete(messageId)
                if (myConfig.alertOnError) {
                  openAlertEvent.emit({
                    title: 'Socket error',
                    text: data.p.msg,
                    level: 'error',
                    sticky: true
                  })
                }
                reject(new Error(data.p.msg))
                break
              case State.Waiting:
              case State.Running:
                // If we get progress, we reset timeout watcher
                setRejectTimeout()
                progress(data.p)
                break
              case State.Success:
                this.callbacks.delete(messageId)
                resolve(data)
                break
              default: // Should never happen
                this.callbacks.delete(messageId)
                reject(new Error(`Unknown socket state: ${data}`))
            }
          }
        })
      })
    } else {
      return ProgressPromise.reject(new Error('Socket closed')) as ProgressPromise<ChannelsMessage>
    }
  }

  send (type: string, payloadOrUri: string | object) {
    // Does not register a response listener
    // Returns a Promise that resolves or rejects immediately
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      const payload = typeof payloadOrUri === 'object'
        ? payloadOrUri
        : uriToPayload(payloadOrUri)
      this._ws.send(JSON.stringify({
        t: type,
        p: payload
      }))
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('socket closed'))
    }
  }
}
