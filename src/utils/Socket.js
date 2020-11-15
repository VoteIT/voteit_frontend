import { uriToPayload, ProgressPromise } from '@/utils'

const DEFAULT_TIMEOT = 5000 // 5s

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

  call (type, payloadOrUri, timeout = DEFAULT_TIMEOT) {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
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
        function setRejectTimeout () {
          if (timeout) {
            timeoutId = setTimeout(() => {
              delete this.callbacks[messageId]
              reject(new Error('response timeout'))
            }, timeout)
          }
        }
        setRejectTimeout()

        this.callbacks[messageId] = data => {
          if (data.i === messageId) {
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
            switch (data.t.split('.')[0]) {
              case 'progress':
                // If we get progress, we reset timeout watcher
                if (data.p.curr === data.p.total) {
                  delete this.callbacks[messageId]
                  progress(data.p)
                  resolve(data)
                } else {
                  setRejectTimeout()
                  progress(data.p)
                }
                break
              case 'error':
                delete this.callbacks[messageId]
                reject(new Error(data))
                break
              default:
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
