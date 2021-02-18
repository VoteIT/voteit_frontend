import meetingRules from './meeting'

const FINISHED_STATES = ['closed', 'archived']

function isFinished (agendaItem) {
  return FINISHED_STATES.includes(agendaItem.state)
}

function isPrivate (agendaItem) {
  return agendaItem.state === 'private'
}

function isProposalBlocked (agendaItem) {
  return false // TODO not exported at this time
}

function canAdd (meeting) {
  // Can add agenda item to meeting
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

export default {
  isFinished,
  isPrivate,
  isProposalBlocked,
  canAdd
}
