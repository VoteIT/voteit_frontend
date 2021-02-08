import { uriToPayload, ProgressPromise, emitter } from '@/utils'
import hostname from '@/utils/hostname'

const wsProtocol = {
  'http:': 'ws:',
  'https:': 'wss:'
}[location.protocol] || 'ws:'

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
  constructor () {
    this.active = false
    this.callbacks = {}
    this.listeners = {
      open: new Set(),
      close: new Set(),
      error: new Set(),
      message: new Set()
    }
  }

  _createEventListener (name) {
    return event => {
      for (const listener of this.listeners[name]) {
        listener(event)
      }
    }
  }

  addEventListener (event, listener) {
    this.listeners[event].add(listener)
  }

  removeEventListener (event, listener) {
    this.listeners[event].delete(listener)
  }

  connect (token) {
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

  close () {
    delete this.token
    this._ws.close()
    this.active = false
  }

  get isOpen () {
    return this.active && this._ws && this._ws.readyState === WebSocket.OPEN
  }

  call (type, payloadOrUri, config) {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
    config = Object.assign({}, DEFAULT_CONFIG, config || {})
    if (this.isOpen) {
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
        let timeoutId
        function setRejectTimeout () {
          if (config.timeout) {
            timeoutId = setTimeout(_ => {
              delete this.callbacks[messageId]
              if (config.alertOnError) {
                emitter.emit('alert-open', {
                  title: 'Socket error',
                  text: 'Request timed out',
                  level: 'error',
                  sticky: true
                })
              }
              reject(new Error('Request timed out'))
            }, config.timeout)
          }
        }
        setRejectTimeout()

        this.callbacks[messageId] = data => {
          if (data.i === messageId) {
            clearTimeout(timeoutId)
            switch (data.s) {
              case STATE.FAILED:
                delete this.callbacks[messageId]
                if (config.alertOnError) {
                  emitter.emit('alert-open', {
                    title: 'Socket error',
                    text: data.p.msg,
                    level: 'error',
                    sticky: true
                  })
                }
                reject(new Error(data.p.msg))
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
      return Promise.reject(new Error('Socket closed'))
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
