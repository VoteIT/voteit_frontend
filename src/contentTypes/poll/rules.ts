import useAuthentication from '@/composables/useAuthentication'

import { agendaItems } from '@/composables/meeting/useAgenda'
import { meetings } from '@/composables/useMeetings'
import useElectoralRegisters from '@/composables/meeting/useElectoralRegisters'

import agendaRules from '../agendaItem/rules'
import meetingRules from '../meeting/rules'
import { AgendaItem, Meeting, Poll } from '../types'

const { user } = useAuthentication()
const { getRegister } = useElectoralRegisters()

const PERMISSIVE_STATES = ['private', 'upcoming', 'ongoing'] // States where moderators can make changes
// TODO: Probably remove 'ongoing', and switch check to be able to close poll.

function isVoter (poll: Poll) {
  if (!poll.electoral_register) return false
  const register = getRegister(poll.electoral_register)
  if (register) {
    return register.has(user.value.pk)
  }
}

function isPollOngoing (poll: Poll) {
  return poll.state === 'ongoing'
}

function isPermissiveState (poll: Poll) {
  return poll.state && PERMISSIVE_STATES.includes(poll.state)
}

function canAdd (context: Meeting | AgendaItem) {
  // TODO Adding to different contexts needs better architecture
  if ('meeting' in context) {
    // Assume agenda item
    return !agendaRules.isArchived(context) && meetingRules.isModerator(meetings.get(context.meeting))
  }
  // Else meeting
  return meetingRules.isModerator(context)
}

function canChange (poll: Poll) {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return isPermissiveState(poll) && meetingRules.isModerator(meeting)
}
function canDelete (poll: Poll) {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return meetingRules.isModerator(meeting)
}

function canVote (poll: Poll) {
  return isPollOngoing(poll) && isVoter(poll)
}

export default {
  canAdd,
  canChange,
  canDelete,
  canVote
}
