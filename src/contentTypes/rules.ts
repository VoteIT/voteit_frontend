import useAuthentication from '../composables/useAuthentication'
import { AuthoredContent } from './types'

const { user } = useAuthentication()

export function isAuthor (content: AuthoredContent) {
  return user.value.pk === content.author
}
