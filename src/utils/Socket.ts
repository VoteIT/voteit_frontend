import { ref } from 'vue'

import { Socket, SocketOptions } from 'envelope-client'

import hostname from '@/utils/hostname'
import {
  beforeAppStateEvent,
  channelLeftEvent,
  channelSubscribedEvent
} from '@/composables/events'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
const DEFAULT_CONFIG: SocketOptions['config'] = {
  timeout: 20_000 // 20 s, longer than server's 15 s
}
const OUTGOING_HEARTBEAT_MS = 60_000

export const SocketState = {
  Connecting: 0,
  Open: 1,
  Closing: 2,
  Closed: 3
} as const
type SocketStateValue = (typeof SocketState)[keyof typeof SocketState]

export const frontendVersion = ref<string | undefined>()
export const socketState = ref<SocketStateValue>()
export const socket = new Socket(`${wsProtocol}//${hostname}/ws/`, {
  beforeAppStateHandler(channel) {
    beforeAppStateEvent.emit(channel)
  },
  config: DEFAULT_CONFIG,
  debug: import.meta.env.NODE_ENV === 'development',
  manual: true
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

socket.addTypeHandler('s', ({ t, i, p }) => {
  const type = t.split('.')[1]
  switch (type) {
    case 'ping':
      socket.respond('s.pong', i)
      break
    case 'frontend_version':
      frontendVersion.value = (p as { version: string }).version
      break
    case 'batch':
    case 'pong':
    case 'stat':
      break
    default:
      console.warn(`Got unknown system message type '${type}'`)
  }
})

socket.on('readyState', ({ readyState }) => {
  socketState.value = readyState as SocketStateValue
})

socket.channels.onSubscriptionChanged(({ subscribed, ...channel }) => {
  const pathedChannel = {
    ...channel,
    path: `${channel.channelType}/${channel.pk}`
  }
  if (subscribed) channelSubscribedEvent.emit(pathedChannel)
  else channelLeftEvent.emit(pathedChannel)
})
