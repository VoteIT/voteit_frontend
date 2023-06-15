import ContentType from '@/contentTypes/ContentType'
import { DiscussionPost } from './types'

export const discussionPostType = new ContentType<DiscussionPost>({
  name: 'discussion_post',
  restEndpoint: 'discussion-posts/'
})
