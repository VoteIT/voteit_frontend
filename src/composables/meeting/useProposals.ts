import { reactive } from 'vue'

import { dateify, orderBy } from '@/utils'

import meetingType from '@/contentTypes/meeting'
import proposalType from '@/contentTypes/proposal'
import { Poll, Proposal } from '@/contentTypes/types'
import { agendaDeletedEvent, agendaItems } from './useAgenda'

const proposals = reactive<Map<number, Proposal>>(new Map())

proposalType.getChannel()
  .updateMap(proposals, dateify)

// Automatically clear proposals for meeting when leaving.
meetingType.getChannel()
  .onLeave(meeting => {
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

export default function useProposals () {
  function * iterProposals (filter: (p: Proposal) => boolean): Generator<Proposal, void> {
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

  function getAgendaProposals (ai: number, filter?: (p: Proposal) => boolean): Proposal[] {
    return orderBy([...iterProposals(
      p => p.agenda_item === ai && (!filter || filter(p))
    )])
  }

  function getPollProposals (poll: Poll): Proposal[] {
    return orderBy(
      poll.proposals
        .map(prop => proposals.get(prop))
        .filter(p => p) as Proposal[]
    )
  }

  function getProposal (pk: number) {
    return proposals.get(pk)
  }

  return {
    agendaItemHasProposals,
    getAgendaProposals,
    getPollProposals,
    getProposal
  }
}
