import useAuthStore from '@/modules/auth/useAuthStore'
import { DiscussionPost } from '@/modules/discussions/types'
import { Proposal } from '@/modules/proposals/types'

export function isAuthor(content: Proposal | DiscussionPost): boolean {
  const { user } = useAuthStore()
  if (!user) return false
  return user.pk === content.author
}
