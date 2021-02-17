import useAuthentication from '../composables/useAuthentication'
import meeting from './meeting'
import poll from './poll'

const { isAuthenticated } = useAuthentication()
const RULES = {
  'meeting.meeting': meeting,
  'poll.poll': poll
}

export default function usePermissions (contentType) {
  const rules = RULES[contentType]
  if (!rules) {
    throw new Error(`Content type ${contentType} has no registered permission rules`)
  }

  function hasPerm (name, context) {
    if (!isAuthenticated.value) {
      return false
    }
    const rule = rules[`can${name[0].toUpperCase()}${name.slice(1)}`]
    return rule ? rule(context) : false
  }

  return {
    hasPerm
  }
}
