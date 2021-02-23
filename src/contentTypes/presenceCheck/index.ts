import { ChannelConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

export default {
  naturalKey: 'presence.presencecheck',
  useChannels: (config?: ChannelConfig) => useChannels('presence_system', config)
}
