import { shallowRef } from 'vue'

import type { ValueOf } from '@/utils/types'

import Socket from './Socket'
import type { SocketOptions, SocketState } from './types'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
const DEFAULT_CONFIG: SocketOptions['config'] = {
  timeout: 20_000 // 20 s, longer than server's 15 s
}
const OUTGOING_HEARTBEAT_MS = 60_000

export const versions = shallowRef<{ backend: string; frontend: string }>()

export const socketState = shallowRef<ValueOf<typeof SocketState>>()
export const socket = new Socket(`${wsProtocol}//${location.host}/ws/`, {
  config: DEFAULT_CONFIG,
  debug: import.meta.env.DEV,
  manual: true
})

socket.onReadyStateChanged((readyState) => {
  socketState.value = readyState
})

/**
 * Ping the socket server to notify backend that user is still active.
 * Only if page is visible, though.
 */
function sendPing() {
  if (document.visibilityState === 'hidden') return
  try {
    socket.send('s.ping')
  } catch {
    // If it fails here, socket is probably dead. That's ok.
  }
}

// TODO Drop this when backend is able to handle user connectivity on it's own
socket.addHeartbeat(sendPing, OUTGOING_HEARTBEAT_MS, 'outgoing')

// When browser says it's online, ping will check socket alive status.
// Should also trigger if a device wakes up from sleep.
window.addEventListener('online', () => {
  if (socket.isOpen) sendPing()
})

socket.registerTypeHandler('s', ({ action, payload }) => {
  switch (action) {
    case 'versions':
      versions.value = payload as (typeof versions)['value']
      break
    case 'ping':
    case 'pong':
    case 'stat':
      break
    default:
      console.warn(`Got unknown system message type '${action}'`)
  }
})
