import Channel from '../Channel'
import ContentType from '../ContentType'
import { DiscussionPost } from '../types'

import rules from './rules'

export default new ContentType<DiscussionPost>({
  rules,
  channelName: 'discussion_post'
})
