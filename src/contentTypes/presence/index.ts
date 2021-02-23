import { ChannelConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

export default {
  naturalKey: 'presence.presence',
  useChannels: (config?: ChannelConfig) => useChannels('presence', config)
}
