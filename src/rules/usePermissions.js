import useAuthentication from '../composables/useAuthentication'

import agendas from './agenda'
import meetings from './meeting'
import polls from './poll'
import proposals from './proposal'

const { isAuthenticated } = useAuthentication()
const RULES = {
  'agenda.agendaitem': agendas,
  'meeting.meeting': meetings,
  'poll.poll': polls,
  'proposal.proposal': proposals
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
