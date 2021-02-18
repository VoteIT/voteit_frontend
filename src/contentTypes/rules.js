import useAuthentication from '../composables/useAuthentication'

const { user } = useAuthentication()

export function isAuthor (content) {
  return user.value.pk === content.author
}
