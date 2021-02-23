import useAuthentication from '../composables/useAuthentication'
import { BaseContent } from './types'

const { user } = useAuthentication()

export function isAuthor (content: BaseContent) {
  return user.value.pk === content.author
}
