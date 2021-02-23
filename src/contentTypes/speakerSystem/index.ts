import { ChannelConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

export default {
  naturalKey: 'speaker.speakersystem',
  useChannels: (config?: ChannelConfig) => useChannels('speaker_system', config)
}
