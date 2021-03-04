import useAuthentication from '../composables/useAuthentication'
import { AuthoredContent } from './types'

const { user } = useAuthentication()

export function isAuthor (content: AuthoredContent) {
  if (user.value) {
    return user.value.pk === content.author
  }
  return false
}
