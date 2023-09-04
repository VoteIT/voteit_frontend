import { WS } from 'vitest-websocket-mock'

if (!global.WS) global.WS = new WS('ws://localhost:3000/ws/', { jsonProtocol: true })

// @ts-ignore
global.CSS = {
  supports () {
    return false
  }
}
