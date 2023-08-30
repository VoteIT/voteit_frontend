import { ref } from 'vue'

import { Socket, SocketOptions } from 'envelope-client'

import hostname from '@/utils/hostname'
import { channelLeftEvent, channelSubscribedEvent } from '@/composables/events'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
const DEFAULT_CONFIG: SocketOptions['config'] = {
  timeout: 20_000 // 20 s, longer than server's 15 s
}
const OUTGOING_HEARTBEAT_MS = 30_000

export const socketState = ref<number | undefined>()
export const socket = new Socket(
  `${wsProtocol}//${hostname}/ws/`,
  {
    config: DEFAULT_CONFIG,
    debug: import.meta.env.NODE_ENV === 'development',
    manual: true
  }
)

socket.addHeartbeat(
  () => socket.send('s.ping'),
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
