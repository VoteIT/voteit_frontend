import { AgendaItem } from '@/modules/agendas/types'

import meetingRules from '@/contentTypes/meeting/rules'
import { meetings } from '../meetings/useMeetings'
import { AgendaState } from '@/contentTypes/agendaItem/workflowStates'

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
