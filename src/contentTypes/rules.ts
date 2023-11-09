import { DiscussionPost } from '@/modules/discussions/types'
import { Proposal } from '@/modules/proposals/types'
import useAuthentication from '../composables/useAuthentication'

const { user } = useAuthentication()

export function isAuthor(content: Proposal | DiscussionPost): boolean {
  if (!user.value) return false
  return user.value.pk === content.author
}
