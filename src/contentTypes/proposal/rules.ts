import { meetings } from '@/modules/meetings/useMeetings'
import { agendaItems } from '@/modules/agendas/useAgenda'

import meetingRules from '../meeting/rules'
import agendaRules from '../agendaItem/rules'
import { isAuthor } from '../rules'
import { Predicate } from '../types'
import { ProposalState } from './workflowStates'
import { polls } from '@/modules/polls/usePolls'
import { AgendaItem } from '@/modules/agendas/types'
import { Proposal } from '@/modules/proposals/types'
import { canAddDiscussionPost } from '@/modules/discussions/rules'

const isPublished: Predicate = (proposal: Proposal) => {
  return proposal.state === ProposalState.Published
}

const isUsedInPoll: Predicate = (proposal: Proposal) => {
  for (const poll of polls.values()) {
    if (poll.proposals.includes(proposal.pk)) return true
  }
  return false
}

const canAdd: Predicate = (agendaItem: AgendaItem) => {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isFinished(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isProposalBlocked(agendaItem) && meetingRules.isProposer(meeting)
    ))
}

function canChange (proposal: Proposal): boolean {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return !meetingRules.isFinished(meeting) && meetingRules.isModerator(meeting)
}

function canDelete (proposal: Proposal): boolean {
  return canChange(proposal) && !isUsedInPoll(proposal)
}

const canRetract: Predicate = (proposal: Proposal) => {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  return isAuthor(proposal) && isPublished(proposal) && !agendaRules.isProposalBlocked(agendaItem) && !agendaRules.isFinished(agendaItem) && !agendaRules.isPrivate(agendaItem)
}

const canComment: Predicate = (proposal: Proposal) => {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  return !!agendaItem && canAddDiscussionPost(agendaItem)
}

export default {
  canAdd,
  canChange,
  canComment,
  canDelete,
  canRetract
}
