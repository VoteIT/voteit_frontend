import { any, filter, Predicate } from 'itertools'
import { orderBy } from 'lodash'
import { reactive } from 'vue'

import { agendaDeletedEvent } from '../agendas/events'
import { agendaItems } from '../agendas/useAgenda'
import { meetingType } from '../meetings/contentTypes'
import { DEFAULT_FILTER_STATES } from '../proposals/workflowStates'
import { Poll } from '../polls/methods/types'

import { Proposal } from './types'
import { proposalType } from './contentTypes'

type ProposalFilter = (p: Proposal) => boolean

const proposals = reactive<Map<number, Proposal>>(new Map())

proposalType.updateMap(proposals)

function proposalExists (prop?: Proposal): prop is Proposal {
  return !!prop
}

// Automatically clear proposals for meeting when leaving.
meetingType.channel.onLeave(meeting => {
  for (const p of proposals.values()) {
    const ai = agendaItems.get(p.agenda_item)
    if (ai?.meeting === meeting) {
      proposals.delete(p.pk)
    }
  }
})

/* Make sure proposals for agenda item are cleaned up on "deletion" (private). */
agendaDeletedEvent.on(pk => {
  for (const proposal of proposals.values()) {
    if (proposal.agenda_item === pk) proposals.delete(proposal.pk)
  }
})

function * iterProposals (filter: ProposalFilter): Generator<Proposal, void> {
  for (const p of proposals.values()) {
    if (filter(p)) yield p
  }
}

function agendaItemHasProposals (ai: number): boolean {
  for (const p of proposals.values()) {
    if (p.agenda_item === ai) return true
  }
  return false
}

function getAgendaProposals (ai: number, _filter?: ProposalFilter, order = 'created', direction: 'asc' | 'desc' = 'asc'): Proposal[] {
  return orderBy(
    filter(
      proposals.values(),
      p => p.agenda_item === ai && (!_filter || _filter(p))
    ),
    [order], [direction]
  )
}

function getPollProposals (poll: Poll): Proposal[] {
  return orderBy(
    poll.proposals
      .map(prop => proposals.get(prop))
      .filter(proposalExists),
    ['created']
  )
}

function getProposal (pk: number) {
  return proposals.get(pk)
}

/**
 * Create a filter function for proposals, matching Agenda Item and optional last read Date.
 * Ignore retracted, denied or unhandled proposals (states not in default filter)
 */
function getLastReadFilter (ai: number, lastRead?: Date): Predicate<Proposal> {
  return (p: Proposal) => {
    return (
      p.agenda_item === ai &&
      (!lastRead || p.created > lastRead) &&
      DEFAULT_FILTER_STATES.includes(p.state)
    )
  }
}

function filterHidesUnread (ai: number, lastRead: Date | undefined, filter: ProposalFilter): boolean {
  return any(
    proposals.values(),
    p => getLastReadFilter(ai, lastRead)(p) && filter(p)
  )
}

function agendaItemAllRead (ai: number, lastRead?: Date): boolean {
  return any(
    proposals.values(),
    getLastReadFilter(ai, lastRead)
  )
}

export default function useProposals () {
  return {
    agendaItemHasProposals,
    agendaItemAllRead,
    filterHidesUnread,
    getAgendaProposals,
    getPollProposals,
    getProposal,
    iterProposals
  }
}
