import { agendaItems } from '../agendas/useAgenda'
import { isAIModerator, isFinishedAI, isPrivateAI, isProposalBlocked } from '../agendas/rules'
import { meetings } from '../meetings/useMeetings'
import { AgendaItem } from '../agendas/types'

import { ProposalText } from './contentTypes'
import useProposals from './useProposals'
import useTextDocuments from './useTextDocuments'
import { Proposal, ProposalState } from './types'
import { polls } from '../polls/usePolls'
import { isAuthor } from '@/contentTypes/rules'
import { isFinishedMeeting, isModerator, isProposer } from '../meetings/rules'

const { iterProposals } = useProposals()
const { proposalTexts } = useTextDocuments()

/* Proposal texts / documents */

export function documentHasProposals (doc: ProposalText): boolean {
  const tags = doc.paragraphs.map(p => p.tag)
  const generator = iterProposals(prop => {
    return prop.agenda_item === doc.agenda_item &&
           tags.some(tag => prop.tags.includes(tag))
  })
  return !!generator.next().value
}

function agendaItemHasDocuments (ai: AgendaItem): boolean {
  for (const doc of proposalTexts.values()) {
    if (doc.agenda_item === ai.pk) return true
  }
  return false
}

export function canAddDocument (ai: AgendaItem): boolean {
  return isAIModerator(ai) &&
         !isFinishedAI(ai) &&
         !agendaItemHasDocuments(ai) // Temporary rule
}

export function canChangeDocument (doc: ProposalText): boolean {
  const ai = agendaItems.get(doc.agenda_item)
  return !!ai && isAIModerator(ai) && !isFinishedAI(ai) && !documentHasProposals(doc)
}

export const canDeleteDocument = canChangeDocument

/* Plain proposals */

function isPublishedProposal (proposal: Proposal): boolean {
  return proposal.state === ProposalState.Published
}

function isUsedInPoll (proposal: Proposal): boolean {
  for (const poll of polls.values()) {
    if (poll.proposals.includes(proposal.pk)) return true
  }
  return false
}

export function canAddProposal (agendaItem: AgendaItem): boolean {
  const meeting = meetings.get(agendaItem.meeting)
  return !isFinishedAI(agendaItem) && (
    isModerator(meeting) || (
      !isPrivateAI(agendaItem) && !isProposalBlocked(agendaItem) && isProposer(meeting)
    ))
}

export function canChangeProposal (proposal: Proposal): boolean {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  const meeting = meetings.get(agendaItem.meeting)
  return !isFinishedMeeting(meeting) && isModerator(meeting)
}

export function canDeleteProposal (proposal: Proposal): boolean {
  return canChangeProposal(proposal) && !isUsedInPoll(proposal)
}

export function canRetractProposal (proposal: Proposal): boolean {
  const agendaItem = agendaItems.get(proposal.agenda_item)
  if (!agendaItem) return false
  return isAuthor(proposal) && isPublishedProposal(proposal) && !isProposalBlocked(agendaItem) && !isFinishedAI(agendaItem) && !isPrivateAI(agendaItem)
}
