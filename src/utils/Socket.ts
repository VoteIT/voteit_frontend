import { ref } from 'vue'

import { Socket, SocketOptions } from 'envelope-client'

import hostname from '@/utils/hostname'
import { channelLeftEvent, channelSubscribedEvent } from '@/composables/events'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
const DEFAULT_CONFIG: SocketOptions['config'] = {
  timeout: 20_000 // 20 s, longer than server's 15 s
}
const OUTGOING_HEARTBEAT_MS = 60_000

export const socketState = ref<number | undefined>()
export const socket = new Socket(
  `${wsProtocol}//${hostname}/ws/`,
  {
    config: DEFAULT_CONFIG,
    debug: import.meta.env.NODE_ENV === 'development',
    manual: true
  }
)

/**
 * Ping the socket server to notify backend that user is still active.
 * Only if page is visible, though.
 */
function sendPing () {
  if (document.visibilityState === 'hidden') return
  try {
    socket.send('s.ping')
  } catch {
    // If it fails here, socket is probably dead. That's ok.
  }
}

// TODO Drop this when backend is able to handle user connectivity on it's own
socket.addHeartbeat(
  sendPing,
  OUTGOING_HEARTBEAT_MS,
  'outgoing'
)

socket.addTypeHandler(
  's',
  ({ t, i }) => {
    if (t !== 's.ping') return
    socket.respond('s.pong', i)
  }
)

socket.on(
  'readyState',
  ({ readyState }) => {
    socketState.value = readyState
  }
)

socket.channels.onSubscriptionChanged(({ subscribed, ...channel }) => {
  const pathedChannel = {
    ...channel,
    path: `${channel.channelType}/${channel.pk}`
  }
  if (subscribed) channelSubscribedEvent.emit(pathedChannel)
  else channelLeftEvent.emit(pathedChannel)
})
