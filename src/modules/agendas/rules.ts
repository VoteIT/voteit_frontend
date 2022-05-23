import { AgendaItem, AgendaState } from '@/modules/agendas/types'

import { isArchivedMeeting, isModerator } from '../meetings/rules'
import { Meeting } from '../meetings/types'

const FINISHED_STATES = [AgendaState.Closed, AgendaState.Archived]
const ACTIVE_STATES = [AgendaState.Upcoming, AgendaState.Ongoing]

export function isAIModerator (agendaItem: AgendaItem): boolean | undefined {
  return isModerator(agendaItem.meeting)
}

export function isFinishedAI (agendaItem: AgendaItem): boolean {
  return FINISHED_STATES.includes(agendaItem.state)
}

export function isActiveAI (agendaItem: AgendaItem): boolean {
  return ACTIVE_STATES.includes(agendaItem.state)
}

export function isArchivedAI (agendaItem: AgendaItem): boolean {
  return agendaItem.state === AgendaState.Archived
}

export function isPrivateAI (agendaItem: AgendaItem): boolean {
  return agendaItem.state === AgendaState.Private
}

export function isProposalBlocked (agendaItem: AgendaItem): boolean {
  return agendaItem.block_proposals
}

export function isDiscussionBlocked (agendaItem: AgendaItem): boolean {
  return agendaItem.block_discussion
}

export function canAddAgendaItem (meeting: Meeting): boolean {
  // Can add agenda item to meeting
  return !isArchivedMeeting(meeting) && !!isModerator(meeting)
}

export function canChangeAgendaItem (agendaItem: AgendaItem): boolean {
  return !isArchivedAI(agendaItem) && !!isModerator(agendaItem.meeting)
}
export const canDeleteAgendaItem = canChangeAgendaItem
