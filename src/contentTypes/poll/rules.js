import useAuthentication from '@/composables/useAuthentication'

import { agendaItems } from '@/composables/meeting/useAgenda'
import { meetings } from '@/composables/useMeetings'
import useElectoralRegisters from '@/composables/meeting/useElectoralRegisters'

import agendaRules from '../agendaItem/rules'
import meetingRules from '../meeting/rules'

const { user } = useAuthentication()
const { getRegister } = useElectoralRegisters()

const PERMISSIVE_STATES = ['private', 'upcoming', 'ongoing'] // States where moderators can make changes
// TODO: Probably remove 'ongoing', and switch check to be able to close poll.

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

function isPermissiveState (poll) {
  return poll.state && PERMISSIVE_STATES.includes(poll.state)
}

function canAdd (aiOrMeeting) {
  // TODO Adding to different contexts needs better architecture
  if (aiOrMeeting.meeting) {
    // Assume agenda item
    return !agendaRules.isArchived(aiOrMeeting) && meetingRules.isModerator(meetings.get(aiOrMeeting.meeting))
  }
  // Else meeting
  return meetingRules.isModerator(aiOrMeeting)
}

function canChange (poll) {
  const agendaItem = agendaItems.get(poll.agenda_item)
  const meeting = meetings.get(agendaItem.meeting)
  return isPermissiveState(poll) && meetingRules.isModerator(meeting)
}
function canDelete (poll) {
  const agendaItem = agendaItems.get(poll.agenda_item)
  const meeting = meetings.get(agendaItem.meeting)
  return meetingRules.isModerator(meeting)
}

function canVote (poll) {
  return isPollOngoing(poll) && isVoter(poll)
}

export default {
  canAdd,
  canChange,
  canDelete,
  canVote
}
