import Channel from '../Channel'
import { ChannelConfig } from '../types'

export default {
  naturalKey: 'presence.presence',
  useChannels: (config?: ChannelConfig) => new Channel('presence', config)
}
