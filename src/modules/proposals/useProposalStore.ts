import {
  any,
  filter,
  map,
  Predicate,
  Primitive,
  reduce,
  sorted
} from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import useAgendaStore from '../agendas/useAgendaStore'
import { agendaDeletedEvent } from '../agendas/events'
import { meetingType } from '../meetings/contentTypes'

import { Proposal } from './types'
import { proposalType } from './contentTypes'

export default defineStore('proposals', () => {
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

  function* iterProposals(predicate?: Predicate<Proposal>) {
    for (const p of proposals.values()) if (!predicate || predicate(p)) yield p
  }

  function countProposals(predicate: Predicate<Proposal>) {
    return reduce(iterProposals(predicate), (acc) => acc + 1, 0)
  }

  function anyProposal(predicate: Predicate<Proposal>): boolean {
    return any(iterProposals(predicate))
  }

  function filterProposals(
    predicate: Predicate<Proposal>,
    keyFn: (prop: Proposal) => Primitive = (p) => p.created,
    reverse = false
  ) {
    return sorted(iterProposals(predicate), keyFn, reverse)
  }

  function forProposals(
    predicate: Predicate<Proposal>,
    fn: (proposal: Proposal) => void
  ) {
    map(iterProposals(predicate), fn)
  }

  function getProposal(pk: number) {
    return proposals.get(pk)
  }

  function getProposals(pks: number[]) {
    return filter(proposals.values(), (p) => pks.includes(p.pk))
  }

  return {
    countProposals,
    anyProposal,
    filterProposals,
    forProposals,
    getProposal,
    getProposals
  }
})
