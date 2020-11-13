const subscriptions = {}

function uriToPayload (uri) {
  const path = uri.split('/')
  return {
    channel_type: path[0],
    pk: path[1]
  }
}

class ProgressPromise extends Promise {
  constructor (executor) {
    const setProgress = progress => {
      if (progress > 1 || progress < 0) {
        throw new TypeError('The progress percentage should be a number between 0 and 1')
      }

      (async () => {
        // We wait for the next microtask tick so `super` is called before we use `this`
        await Promise.resolve()

        // Note: we don't really have guarantees over
        // the order in which async operations are evaluated,
        // so if we get an out-of-order progress, we'll just discard it.
        if (progress <= this._progress) {
          return
        }

        this._progress = progress

        for (const listener of this._listeners) {
          listener(progress)
        }
      })()
    }

    super((resolve, reject) => {
      executor(
        value => {
          setProgress(1)
          resolve(value)
        },
        reject,
        progress => {
          if (progress !== 1) {
            setProgress(progress)
          }
        }
      )
    })

    this._listeners = new Set()
    this._setProgress = setProgress
    this._progress = 0
  }

  get progress () {
    return this._progress
  }

  onProgress (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
    }

    this._listeners.add(callback)
    return this
  }
}

export default {
  install (app) {
    const socket = new WebSocket('ws://localhost:8000/ws/token/')

    function send (type, payloadOrUri) {
      if (socket.readyState === socket.OPEN) {
        const payload = typeof payloadOrUri === 'object'
          ? payloadOrUri
          : uriToPayload(payloadOrUri)
        socket.send(JSON.stringify({
          t: type,
          p: payload
        }))
      }
    }

    socket.addEventListener('open', () => {
      console.log('socket open')
      Object.keys(subscriptions).forEach(uri => {
        send('object.subscribe', uri)
      })
    })
    socket.addEventListener('close', () => {
      console.log('socket closed')
    })
    socket.addEventListener('error', () => {
      console.log('socket error')
    })
    socket.addEventListener('message', event => {
      const data = JSON.parse(event.data)
      const baseType = data.t.split('.')[0]
      // Do callback for every registered subscription matching first part
      Object.keys(subscriptions)
        .filter(uri => uri.split('/')[0] === baseType)
        .forEach(uri => {
          for (const callback of subscriptions[uri]) {
            callback(data)
          }
        })
    })

    const objects = {
      subscribe (uri, callback) {
        if (typeof callback !== 'function') {
          throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
        }

        if (subscriptions[uri] === undefined) {
          subscriptions[uri] = new Set()
        }
        if (!subscriptions[uri].size) {
          send('object.subscribe', uri)
        }
        subscriptions[uri].add(callback)
      },
      leave (uri, callback) {
        subscriptions[uri].delete(callback)
        if (!subscriptions[uri].size) {
          send('object.leave', uri)
        }
      },
      get (uri) {
        // Testing code
        return new ProgressPromise((resolve, reject, progress) => {
          const steps = 15
          let count = 0
          function tick () {
            count += 1
            if (count < steps) {
              progress(count / steps)
              if (Math.random() < 1 / steps / 2) {
                reject('nay')
              } else {
                setTimeout(tick, Math.random() * 300)
              }
            } else {
              resolve('yay')
            }
          }
          tick()
        })
      },
      post (uri) {
        // TODO
        return new ProgressPromise()
      },
      put (uri) {
        // TODO
        return new ProgressPromise()
      },
      delete (uri) {
        // TODO
        return new ProgressPromise()
      }
    }
    app.config.globalProperties.$objects = objects
  }
}
