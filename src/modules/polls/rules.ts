import { AgendaItem } from '../agendas/types'
import { isAIModerator, isArchivedAI, isFinishedAI } from '../agendas/rules'
import useAgendaStore from '../agendas/useAgendaStore'
import useAuthStore from '../auth/useAuthStore'
import { meetings } from '../meetings/useMeetings'
import useElectoralRegisters from '../meetings/electoralRegisters/useElectoralRegisters'
import {
  isArchivedMeeting,
  isFinishedMeeting,
  isModerator
} from '../meetings/rules'
import { Meeting } from '../meetings/types'

import { Poll, PollState } from './types'

const { getRegister } = useElectoralRegisters()

const PERMISSIVE_STATES = [PollState.Private, PollState.Upcoming] // States where moderators can make changes

export function isPollVoter(poll: Poll): boolean {
  const { user } = useAuthStore()
  if (!poll.electoral_register || !user) return false
  const register = getRegister(poll.electoral_register)
  if (!register) return false
  return !!register.weights.find((v) => v.user === user?.pk)
}

function isOngoingPoll(poll: Poll): boolean {
  return poll.state === PollState.Ongoing
}

function isPermissiveState(poll: Poll): boolean {
  return PERMISSIVE_STATES.includes(poll.state)
}

function isAgendaItem(context: Meeting | AgendaItem): context is AgendaItem {
  return 'meeting' in context
}

export function canAddPoll(context: Meeting | AgendaItem): boolean {
  // TODO Adding to different contexts needs better architecture
  if (isAgendaItem(context))
    return !isFinishedAI(context) && !!isAIModerator(context)
  // Else meeting
  return !isFinishedMeeting(context) && !!isModerator(context)
}

export function canChangePoll(poll: Poll): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(poll.agenda_item)
  if (!agendaItem) return false
  return isPermissiveState(poll) && !!isModerator(agendaItem.meeting)
}

export function canDeletePoll(poll: Poll): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(poll.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return (
    !isArchivedMeeting(meeting) &&
    !isArchivedAI(agendaItem) &&
    !!isModerator(agendaItem.meeting)
  )
}

export function canVote(poll: Poll): boolean {
  return isOngoingPoll(poll) && isPollVoter(poll)
}
