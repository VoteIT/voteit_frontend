const subscriptions = {}

function keyToPayload (key) {
  const splitKey = key.split('/')
  return {
    channel_type: splitKey[0],
    pk: splitKey[1]
  }
}

export default {
  install (app) {
    function send (type, payloadOrKey) {
      if (socket.readyState === socket.OPEN) {
        const payload = typeof payloadOrKey === 'object'
          ? payloadOrKey
          : keyToPayload(payloadOrKey)
        socket.send(JSON.stringify({
          t: type,
          p: payload
        }))
      }
    }
    const socket = new WebSocket('ws://localhost:8000/ws/token/')
    socket.addEventListener('open', () => {
      console.log('socket open')
      Object.keys(subscriptions).forEach(key => {
        send('object.subscribe', key)
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
      console.log('socket message', data)
      // Do callback for every registered subscription matching first part
      Object.keys(subscriptions)
        .filter(k => k.split('/')[0] === baseType)
        .forEach(k => {
          subscriptions[k].forEach(fn => {
            fn(data.p) // Send only payload for now
          })
        })
    })
    app.config.globalProperties.$subscribeObject = (key, fn) => {
      subscriptions[key] = subscriptions[key] || []
      subscriptions[key].push(fn)
      send('object.subscribe', key)
    }
    app.config.globalProperties.$leaveObject = (key, fn) => {
      subscriptions[key] = subscriptions[key].filter(v => v !== fn)
      send('object.leave', key)
    }
    // app.config.globalProperties.$socket = socket
  }
}
