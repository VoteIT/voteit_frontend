import useAuthentication from '../composables/useAuthentication'
import { AuthoredContent, Predicate } from './types'

const { user } = useAuthentication()

export const isAuthor: Predicate = (content: AuthoredContent) => {
  if (!user.value) return false
  return user.value.pk === content.author
}
