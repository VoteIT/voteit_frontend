import Channel from '../Channel'
import { ChannelConfig } from '../types'

export default {
  naturalKey: 'speaker.speakersystem',
  useChannels: (config?: ChannelConfig) => new Channel('speaker_system', config)
}
