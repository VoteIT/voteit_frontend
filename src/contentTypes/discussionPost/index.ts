import Channel from '../Channel'
import { ChannelConfig } from '../types'

import rules from './rules'

export default {
  naturalKey: 'discussion.discussionpost',
  rules,
  useChannels: (config?: ChannelConfig) => new Channel('discussion_post', config)
}
