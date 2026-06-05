import { WS } from 'vitest-websocket-mock'
import { Settings } from 'luxon'

Settings.defaultLocale = 'en'

if (!global.WS) global.WS = new WS('ws://localhost:3000/ws/', { jsonProtocol: true })

// @ts-ignore
global.CSS = {
  supports () {
    return false
  }
}
