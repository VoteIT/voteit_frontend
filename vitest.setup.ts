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

// Tests must never reach the network. Reject instead, so an unmocked request
// surfaces as a failure rather than a real (and possibly hanging) connection.
// Override per test with vi.stubGlobal('fetch', ...) where a response is needed.
global.fetch = () =>
  Promise.reject(new Error('Unmocked fetch in test — mock @/utils/restApi'))
