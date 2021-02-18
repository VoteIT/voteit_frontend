import { meetings } from '../composables/useMeetings'
import { agendaItems } from '../composables/meeting/useAgenda'
import useAuthentication from '../composables/useAuthentication'

import meetingRules from './meeting'
import agendaRules from './agenda'

const { user } = useAuthentication()

function isPublished (proposal) {
  return proposal.state === 'published'
}

function isAuthor (proposal) {
  return proposal.author === user.value.pk
}

function isUsedInPoll (proposal) {
  return proposal.polls && proposal.polls.length
}

function canAdd (agendaItem) {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isFinished(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isProposalBlocked(agendaItem) && meetingRules.isProposer(meeting)
    ))
}

function canChange (proposal) {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  const meeting = meetings.get(agendaItem.meeting)
  return !meetingRules.isFinished(meeting) && meetingRules.isModerator(meeting)
}

function canDelete (proposal) {
  return canChange(proposal) && !isUsedInPoll(proposal)
}

function canRetract (proposal) {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  const meeting = meetings.get(agendaItem.meeting)
  if (meetingRules.isModerator(meeting)) {
    return !meetingRules.isFinished(meeting)
  }
  return isAuthor(proposal) && isPublished(proposal) && !agendaRules.isProposalBlocked(agendaItem) && !agendaRules.isFinished(agendaItem) && !agendaRules.isPrivate(agendaItem)
}

export default {
  canAdd,
  canChange,
  canDelete,
  canRetract
}
