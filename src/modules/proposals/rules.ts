import { isAuthor } from '@/contentTypes/rules'
import {
  isAIModerator,
  isFinishedAI,
  isPrivateAI,
  isProposalBlocked
} from '../agendas/rules'
import { AgendaItem } from '../agendas/types'
import useAgendaStore from '../agendas/useAgendaStore'
import useAuthStore from '../auth/useAuthStore'
import { isFinishedMeeting, isModerator, isProposer } from '../meetings/rules'
import useGroupStore from '../meetings/useGroupStore'
import usePollStore from '../polls/usePollStore'

import { ProposalText } from './contentTypes'
import { Proposal, ProposalState } from './types'
import useProposalStore from './useProposalStore'

/* Proposal texts / documents */

export function documentHasProposals(doc: ProposalText): boolean {
  const tags = doc.paragraphs.map((p) => p.tag)
  return useProposalStore().anyAiProposal(doc.agenda_item, (prop) =>
    tags.some((tag) => prop.tags.includes(tag))
  )
}

function agendaItemHasDocuments(ai: AgendaItem): boolean {
  return useProposalStore().anyAiDocument(ai.pk)
}

export function canAddDocument(ai: AgendaItem): boolean {
  return !!isAIModerator(ai) && !isFinishedAI(ai) && !agendaItemHasDocuments(ai) // Temporary rule
}

export function canChangeDocument(doc: ProposalText): boolean {
  const ai = useAgendaStore().getAgendaItem(doc.agenda_item)
  return (
    !!ai &&
    !!isAIModerator(ai) &&
    !isFinishedAI(ai) &&
    !documentHasProposals(doc)
  )
}

export const canDeleteDocument = canChangeDocument

/* Plain proposals */

function isPublishedProposal(proposal: Proposal): boolean {
  return proposal.state === ProposalState.Published
}

function isUsedInPoll(proposal: Proposal): boolean {
  return usePollStore().anyPollWithProposal(proposal.pk)
}

export function getProposalBlockReason(agendaItem: AgendaItem) {
  if (isFinishedAI(agendaItem)) return 'closed'
  if (isProposalBlocked(agendaItem)) return 'blocked'
  if (!isProposer(agendaItem.meeting)) return 'nonProposer'
}

export function canAddProposal(agendaItem: AgendaItem): boolean {
  return (
    !isFinishedAI(agendaItem) &&
    (!!isModerator(agendaItem.meeting) ||
      (!isPrivateAI(agendaItem) &&
        !isProposalBlocked(agendaItem) &&
        !!isProposer(agendaItem.meeting)))
  )
}

export function canChangeProposal(proposal: Proposal): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(proposal.agenda_item)
  if (!agendaItem) return false
  return (
    !isFinishedMeeting(agendaItem.meeting) && !!isModerator(agendaItem.meeting)
  )
}

export function canDeleteProposal(proposal: Proposal): boolean {
  return canChangeProposal(proposal) && !isUsedInPoll(proposal)
}

/**
 * Proposals posted as a meeting group may be retracted by any member of that group.
 */
function isAuthorOrGroupAuthorMember(proposal: Proposal): boolean {
  if (isAuthor(proposal)) return true
  const { user } = useAuthStore()
  return (
    !!user &&
    proposal.meeting_group !== null &&
    useGroupStore().isGroupMember(proposal.meeting_group, user.pk)
  )
}

export function canRetractProposal(proposal: Proposal): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(proposal.agenda_item)
  if (!agendaItem) return false
  if (isFinishedAI(agendaItem) || !isPublishedProposal(proposal)) return false
  return (
    !!isAIModerator(agendaItem) ||
    (isAuthorOrGroupAuthorMember(proposal) &&
      !!isProposer(agendaItem.meeting) &&
      !isProposalBlocked(agendaItem))
  )
}
