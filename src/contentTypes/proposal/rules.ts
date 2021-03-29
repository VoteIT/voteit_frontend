import { meetings } from '@/composables/useMeetings'
import { agendaItems } from '@/composables/meeting/useAgenda'

import meetingRules from '../meeting/rules'
import discussionRules from '../discussionPost/rules'
import agendaRules from '../agendaItem/rules'
import { isAuthor } from '../rules'
import { AgendaItem, Predicate, Proposal } from '../types'
import { ProposalState } from './workflowStates'
import { polls } from '@/composables/meeting/usePolls'

function isPublished (proposal: Proposal) {
  return proposal.state === ProposalState.Published
}

function isUsedInPoll (proposal: Proposal) {
  for (const poll of polls.values()) {
    if (poll.proposals.includes(proposal.pk)) return true
  }
  return false
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
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return !meetingRules.isFinished(meeting) && meetingRules.isModerator(meeting)
}

function canDelete (proposal: Proposal) {
  return canChange(proposal) && !isUsedInPoll(proposal)
}

function canRetract (proposal: Proposal) {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  return isAuthor(proposal) && isPublished(proposal) && !agendaRules.isProposalBlocked(agendaItem) && !agendaRules.isFinished(agendaItem) && !agendaRules.isPrivate(agendaItem)
}

const canComment: Predicate = (proposal: Proposal) => {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  return discussionRules.canAdd(agendaItem)
}

export default {
  canAdd,
  canChange,
  canComment,
  canDelete,
  canRetract
}
