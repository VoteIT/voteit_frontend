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

export default class Socket {
  constructor (token) {
    this.token = token
    this.callbacks = {}
    this.listeners = new Set()
    this.connect()
  }

  createEventListener (type) {
    return event => {
      this.listeners.forEach(listener => {
        listener[type] && listener[type](event)
      })
    }
  }

  addEventListener (listener) {
    this.listeners.add(listener)
  }

  removeEventListener (listener) {
    this.listeners.delete(listener)
  }

  connect (token) {
    this._ws = new WebSocket(`ws://localhost:8000/ws/${this.token}/`)

    this._ws.addEventListener('open', this.createEventListener('open'))
    this._ws.addEventListener('close', this.createEventListener('close'))
    this._ws.addEventListener('error', this.createEventListener('error'))
    this._ws.addEventListener('message', this.createEventListener('message'))
    this._ws.addEventListener('message', event => {
      const data = JSON.parse(event.data)
      if (data.i && data.i in this.callbacks) {
        // Do callback for message id. Callbacks will have to remove themselves from listeners.
        this.callbacks[data.i](data)
      }
    })
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
      return Promise.reject(new Error('socket closed'))
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
