import { meetings } from '@/composables/useMeetings'
import { agendaItems } from '@/composables/meeting/useAgenda'

import meetingRules from '../meeting/rules'
import agendaRules from '../agendaItem/rules'
import { isAuthor } from '../rules'
import { AgendaItem, Proposal } from '../types'

function isPublished (proposal: Proposal) {
  return proposal.state === 'published'
}

function isUsedInPoll (proposal: Proposal) {
  return proposal.polls && proposal.polls.length
}

function canAdd (agendaItem: AgendaItem) {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isFinished(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isProposalBlocked(agendaItem) && meetingRules.isProposer(meeting)
    ))
}

function canChange (proposal: Proposal) {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  const meeting = meetings.get(agendaItem.meeting)
  return !meetingRules.isFinished(meeting) && meetingRules.isModerator(meeting)
}

function canDelete (proposal: Proposal) {
  return canChange(proposal) && !isUsedInPoll(proposal)
}

function canRetract (proposal: Proposal) {
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
