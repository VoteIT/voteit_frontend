import useChannels from '@/composables/useChannels'

import rules from './rules'

export default {
  naturalKey: 'discussion.discussionpost',
  rules,
  useChannels: config => useChannels('discussion_post', config)
}
