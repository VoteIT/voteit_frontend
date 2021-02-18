import { meetings } from '@/composables/useMeetings'

import meetingRules from '../meeting/rules'

const FINISHED_STATES = ['closed', 'archived']

function isFinished (agendaItem) {
  return FINISHED_STATES.includes(agendaItem.state)
}

function isArchived (agendaItem) {
  return agendaItem.state === 'archived'
}

function isPrivate (agendaItem) {
  return agendaItem.state === 'private'
}

function isProposalBlocked (agendaItem) {
  return agendaItem.block_discussion
}

function isDiscussionBlocked (agendaItem) {
  return agendaItem.block_proposals
}

function canAdd (meeting) {
  // Can add agenda item to meeting
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

function canChange (agendaItem) {
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
