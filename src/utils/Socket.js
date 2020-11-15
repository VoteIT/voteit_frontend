import { uriToPayload, ProgressPromise } from '@/utils'

const DEFAULT_CONFIG = {
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
  constructor (token) {
    this.token = token
    this.callbacks = {}
    this.listeners = {
      open: new Set(),
      close: new Set(),
      error: new Set(),
      message: new Set()
    }
    this.connect()
  }

  _createEventListener (event) {
    return evt => {
      for (const listener of this.listeners[event]) {
        listener(evt)
      }
    }
  }

  addEventListener (event, listener) {
    this.listeners[event].add(listener)
  }

  removeEventListener (event, listener) {
    this.listeners[event].delete(listener)
  }

  connect () {
    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(`ws://localhost:8000/ws/${this.token}/`)

      this._ws.addEventListener('error', reject)
      this._ws.addEventListener('open', resolve)
      this._ws.addEventListener('message', event => {
        const data = JSON.parse(event.data)
        if (data.i && data.i in this.callbacks) {
          // Do callback for message id. Callbacks will have to remove themselves from listeners.
          this.callbacks[data.i](data)
        }
      })

      EVENTS.forEach(event => {
        this._ws.addEventListener(event, this._createEventListener(event))
      })
    })
  }

  get isOpen () {
    return this._ws.readyState === WebSocket.OPEN
  }

  call (type, payloadOrUri, config) {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
    config = Object.assign({}, DEFAULT_CONFIG, config || {})
    if (this._ws.readyState === WebSocket.OPEN) {
      const messageId = sessionStorage.socketMessageCounter || '1'
      const payload = typeof payloadOrUri === 'object'
        ? payloadOrUri
        : uriToPayload(payloadOrUri)
      this._ws.send(JSON.stringify({
        t: type,
        p: payload,
        i: messageId
      }))
      sessionStorage.socketMessageCounter = Number(messageId) + 1
      return new ProgressPromise((resolve, reject, progress) => {
        let timeoutId = null
        const setRejectTimeout = () => {
          if (config.timeout) {
            timeoutId = setTimeout(() => {
              delete this.callbacks[messageId]
              reject(new Error('response timeout'))
            }, config.timeout)
          }
        }
        setRejectTimeout()

        this.callbacks[messageId] = data => {
          if (data.i === messageId) {
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
            switch (data.s) {
              case STATE.FAILED:
                delete this.callbacks[messageId]
                reject(new Error(data.t))
                break
              case STATE.WAITING:
              case STATE.RUNNING:
                // If we get progress, we reset timeout watcher
                setRejectTimeout()
                progress(data.p)
                break
              default: // Should be STATE.FAILED
                delete this.callbacks[messageId]
                resolve(data)
                break
            }
          }
        }
      })
    } else {
      return ProgressPromise.reject(new Error('socket closed'))
    }
  }

  send (type, payloadOrUri) {
    // Does not register a response listener
    // Returns a Promise that resolves or rejects immediately
    if (this._ws.readyState === WebSocket.OPEN) {
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
