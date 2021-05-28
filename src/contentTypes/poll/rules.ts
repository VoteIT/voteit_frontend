import useAuthentication from '@/composables/useAuthentication'

import { agendaItems } from '@/composables/meeting/useAgenda'
import { meetings } from '@/composables/useMeetings'
import useElectoralRegisters from '@/composables/meeting/useElectoralRegisters'

import agendaRules from '../agendaItem/rules'
import meetingRules from '../meeting/rules'
import { AgendaItem, Meeting, Poll, Predicate } from '../types'

const { user } = useAuthentication()
const { getRegister } = useElectoralRegisters()

const PERMISSIVE_STATES = ['private', 'upcoming', 'ongoing'] // States where moderators can make changes

const isVoter: Predicate = (poll: Poll) => {
  if (!poll.electoral_register || !user.value) return false
  const register = getRegister(poll.electoral_register)
  if (!register) return false
  return register.has(user.value.pk)
}

const isOngoing: Predicate = (poll: Poll) => {
  return poll.state === 'ongoing'
}

const isPermissiveState: Predicate = (poll: Poll) => {
  return PERMISSIVE_STATES.includes(poll.state)
}

const canAdd: Predicate = (context: Meeting | AgendaItem) => {
  // TODO Adding to different contexts needs better architecture
  if ('meeting' in context) {
    // Is agenda item
    return !agendaRules.isArchived(context) && meetingRules.isModerator(meetings.get(context.meeting))
  }
  // Else meeting
  return meetingRules.isModerator(context)
}

const canChange: Predicate = (poll: Poll) => {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return isPermissiveState(poll) && meetingRules.isModerator(meeting)
}

const canDelete: Predicate = (poll: Poll) => {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return meetingRules.isModerator(meeting)
}

const canVote: Predicate = (poll: Poll) => {
  return isOngoing(poll) && isVoter(poll)
}

export default {
  canAdd,
  canChange,
  canDelete,
  canVote,
  isOngoing
}
