import useAuthentication from '@/composables/useAuthentication'

import { agendaItems } from '../agendas/useAgenda'
import { AgendaItem } from '../agendas/types'
import { isAIModerator, isArchivedAI, isFinishedAI } from '../agendas/rules'
import { meetings } from '../meetings/useMeetings'
import useElectoralRegisters from '../meetings/useElectoralRegisters'
import { isArchivedMeeting, isFinishedMeeting, isModerator } from '../meetings/rules'
import { Meeting } from '../meetings/types'

import { PollState } from './types'
import { Poll } from './methods/types'

const { user } = useAuthentication()
const { getRegister } = useElectoralRegisters()

const PERMISSIVE_STATES = [PollState.Private, PollState.Upcoming, PollState.Ongoing] // States where moderators can make changes

function isPollVoter (poll: Poll): boolean {
  if (!poll.electoral_register || !user.value) return false
  const register = getRegister(poll.electoral_register)
  if (!register) return false
  return !!register.weights.find(v => v.user === user.value?.pk)
}

function isOngoingPoll (poll: Poll): boolean {
  return poll.state === PollState.Ongoing
}

function isPermissiveState (poll: Poll): boolean {
  return PERMISSIVE_STATES.includes(poll.state)
}

function isAgendaItem (context: Meeting | AgendaItem): context is AgendaItem {
  return 'meeting' in context
}

export function canAddPoll (context: Meeting | AgendaItem): boolean {
  // TODO Adding to different contexts needs better architecture
  if (isAgendaItem(context)) return !isFinishedAI(context) && !!isAIModerator(context)
  // Else meeting
  return !isFinishedMeeting(context) && !!isModerator(context)
}

export function canChangePoll (poll: Poll): boolean {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return isPermissiveState(poll) && !!isModerator(meeting)
}

export function canDeletePoll (poll: Poll): boolean {
  const agendaItem = agendaItems.get(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return !isArchivedMeeting(meeting) && !isArchivedAI(agendaItem) && !!isModerator(meeting)
}

export function canVote (poll: Poll): boolean {
  return isOngoingPoll(poll) && isPollVoter(poll)
}
