import { any, filter, ifilter, map, Predicate } from 'itertools'
import { orderBy } from 'lodash'
import { reactive } from 'vue'

import { agendaDeletedEvent } from '../agendas/events'
import { agendaItems } from '../agendas/useAgenda'
import { meetingType } from '../meetings/contentTypes'

import { Proposal } from './types'
import { proposalType } from './contentTypes'

const proposals = reactive<Map<number, Proposal>>(new Map())

proposalType.updateMap(proposals)

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

function agendaItemHasProposals (ai: number): boolean {
  for (const p of proposals.values()) {
    if (p.agenda_item === ai) return true
  }
  return false
}

function getAgendaProposals (ai: number, predicate?: Predicate<Proposal>, order = 'created', direction: 'asc' | 'desc' = 'asc'): Proposal[] {
  return orderBy(
    filter(
      proposals.values(),
      p => p.agenda_item === ai && (!predicate || predicate(p))
    ),
    order, direction
  )
}

function getProposal (pk: number) {
  return proposals.get(pk)
}

function anyProposal (predicate: Predicate<Proposal>): boolean {
  return any(
    proposals.values(),
    predicate
  )
}

function forProposals (predicate: Predicate<Proposal>, fn: (proposal: Proposal) => void) {
  map(
    ifilter(
      proposals.values(),
      predicate
    ),
    fn
  )
}

export default function useProposals () {
  return {
    agendaItemHasProposals,
    anyProposal,
    forProposals,
    getAgendaProposals,
    getProposal
  }
}
