import { AgendaItem } from '@/modules/agendas/types'

import meetingRules from '@/contentTypes/meeting/rules'
import { meetings } from '../meetings/useMeetings'
import { AgendaState } from '@/contentTypes/agendaItem/workflowStates'
import { Meeting } from '@/contentTypes/types'

const FINISHED_STATES = [AgendaState.Closed, AgendaState.Archived]
const ACTIVE_STATES = [AgendaState.Upcoming, AgendaState.Ongoing]

export function isAIModerator (agendaItem: AgendaItem): boolean {
  return meetingRules.isModerator(meetings.get(agendaItem.meeting))
}

export function isFinishedAI (agendaItem: AgendaItem): boolean {
  return FINISHED_STATES.includes(agendaItem.state)
}

export function isActiveAI (agendaItem: AgendaItem): boolean {
  return ACTIVE_STATES.includes(agendaItem.state)
}

export function isArchivedAI (agendaItem: AgendaItem): boolean {
  return agendaItem.state === 'archived'
}

export function canAddAgendaItem (meeting: Meeting): boolean {
  // Can add agenda item to meeting
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

export function canChangeAgendaItem (agendaItem: AgendaItem): boolean {
  const meeting = meetings.get(agendaItem.meeting)
  return !isArchivedAI(agendaItem) && meetingRules.isModerator(meeting)
}
