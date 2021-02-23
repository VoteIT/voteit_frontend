import { ChannelConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

import rules from './rules'

export default {
  naturalKey: 'discussion.discussionpost',
  rules,
  useChannels: (config?: ChannelConfig) => useChannels('discussion_post', config)
}
