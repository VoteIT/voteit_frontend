import useAuthentication from '../composables/useAuthentication'

import useElectoralRegisters from '../composables/meeting/useElectoralRegisters'

const { user } = useAuthentication()
const { getRegister } = useElectoralRegisters()

function isVoter (poll) {
  if (!poll.electoral_register) return false
  const register = getRegister(poll.electoral_register)
  if (register) {
    return register.has(user.value.pk)
  }
}

function isPollOngoing (poll) {
  return poll.state === 'ongoing'
}

function canVote (poll) {
  return isPollOngoing(poll) && isVoter(poll)
}

export default {
  canVote
}
