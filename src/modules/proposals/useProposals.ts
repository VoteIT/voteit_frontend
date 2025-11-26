import { any, map, Predicate } from 'itertools'
import { orderBy } from 'lodash'
import { reactive } from 'vue'

import { agendaDeletedEvent } from '../agendas/events'
import useAgendaStore from '../agendas/useAgendaStore'
import { meetingType } from '../meetings/contentTypes'

import { isProposal, Proposal } from './types'
import { proposalType } from './contentTypes'

const proposals = reactive<Map<number, Proposal>>(new Map())

proposalType.updateMap(proposals, { participants: 'm', moderators: 'm' })

// Automatically clear proposals for meeting when leaving.
meetingType.channel.onLeave((meeting) => {
  for (const p of proposals.values()) {
    const ai = useAgendaStore().getAgendaItem(p.agenda_item)
    if (ai?.meeting === meeting) {
      proposals.delete(p.pk)
    }
  }
})

/* Make sure proposals for agenda item are cleaned up on "deletion" (private). */
agendaDeletedEvent.on((pk) => {
  for (const proposal of proposals.values()) {
    if (proposal.agenda_item === pk) proposals.delete(proposal.pk)
  }
})

export function* iterProposals(predicate?: Predicate<Proposal>) {
  for (const p of proposals.values()) {
    if (!predicate || predicate(p)) yield p
  }
}

function getAgendaProposals(
  ai: number,
  predicate?: Predicate<Proposal>,
  order = 'created',
  direction: 'asc' | 'desc' = 'asc'
): Proposal[] {
  return orderBy(
    [
      ...iterProposals(
        (p) => p.agenda_item === ai && (!predicate || predicate(p))
      )
    ],
    order,
    direction
  )
}

function getProposal(pk: number) {
  return proposals.get(pk)
}

export function getProposals(pks: number[]) {
  return pks.map(getProposal).filter(isProposal)
}

export function filterProposals(
  predicate: Predicate<Proposal>,
  order: keyof Proposal = 'created',
  direction: 'asc' | 'desc' = 'asc'
) {
  return orderBy([...iterProposals(predicate)], order, direction)
}

export function anyProposal(predicate: Predicate<Proposal>): boolean {
  return any(iterProposals(predicate))
}

function forProposals(
  predicate: Predicate<Proposal>,
  fn: (proposal: Proposal) => void
) {
  map(iterProposals(predicate), fn)
}

export default function useProposals() {
  return {
    anyProposal,
    forProposals,
    getAgendaProposals,
    getProposal
  }
}
