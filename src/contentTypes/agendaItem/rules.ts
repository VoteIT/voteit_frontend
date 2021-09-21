import { meetings } from '@/modules/meetings/useMeetings'

import meetingRules from '../meeting/rules'
import { AgendaItem, Meeting, Predicate } from '../types'

const FINISHED_STATES = ['closed', 'archived']

const isFinished: Predicate = (agendaItem: AgendaItem) => {
  return FINISHED_STATES.includes(agendaItem.state)
}

const isArchived: Predicate = (agendaItem: AgendaItem) => {
  return agendaItem.state === 'archived'
}

const isPrivate: Predicate = (agendaItem: AgendaItem) => {
  return agendaItem.state === 'private'
}

const isProposalBlocked: Predicate = (agendaItem: AgendaItem) => {
  return agendaItem.block_proposals
}

const isDiscussionBlocked: Predicate = (agendaItem: AgendaItem) => {
  return agendaItem.block_discussion
}

const canAdd: Predicate = (meeting: Meeting) => {
  // Can add agenda item to meeting
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

const canChange: Predicate = (agendaItem: AgendaItem) => {
  const meeting = meetings.get(agendaItem.meeting)
  return !isArchived(agendaItem) && meetingRules.isModerator(meeting)
}

export default {
  isArchived,
  isDiscussionBlocked,
  isFinished,
  isPrivate,
  isProposalBlocked,
  canAdd,
  canChange,
  canDelete: canChange
}
