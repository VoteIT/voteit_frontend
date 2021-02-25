import { meetings } from '@/composables/useMeetings'

import meetingRules from '../meeting/rules'
import { AgendaItem, Meeting } from '../types'

const FINISHED_STATES = ['closed', 'archived']

function isFinished (agendaItem: AgendaItem) {
  return FINISHED_STATES.includes(agendaItem.state)
}

function isArchived (agendaItem: AgendaItem) {
  return agendaItem.state === 'archived'
}

function isPrivate (agendaItem: AgendaItem) {
  return agendaItem.state === 'private'
}

function isProposalBlocked (agendaItem: AgendaItem) {
  // TODO
  return false
  // return agendaItem.block_discussion
}

function isDiscussionBlocked (agendaItem: AgendaItem) {
  // TODO
  return false
  // return agendaItem.block_proposals
}

function canAdd (meeting: Meeting) {
  // Can add agenda item to meeting
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

function canChange (agendaItem: AgendaItem) {
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
