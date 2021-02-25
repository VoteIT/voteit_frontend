import Channel from '../Channel'
import { ChannelConfig } from '../types'

export default {
  naturalKey: 'presence.presencecheck',
  useChannels: (config?: ChannelConfig) => new Channel('presence_system', config)
}
