import { reactive } from 'vue'

import { dateify, orderBy } from '@/utils'

import meetingType from '@/contentTypes/meeting'
import proposalType from '@/contentTypes/proposal'
import { Poll, Proposal } from '@/contentTypes/types'
import { DEFAULT_FILTER_STATES } from '@/contentTypes/proposal/workflowStates'
import { agendaDeletedEvent, agendaItems } from '@/modules/agendas/useAgenda'

type ProposalFilter = (p: Proposal) => boolean

const proposals = reactive<Map<number, Proposal>>(new Map())
/* Used to figure out whether to mark agenda item as read */
const userReadProposals = new Set<number>() // Track read proposals through since last reload

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

  function getAgendaProposals (ai: number, filter?: ProposalFilter, order = 'created', reversed = false): Proposal[] {
    return orderBy([...iterProposals(
      p => p.agenda_item === ai && (!filter || filter(p))
    )], order, reversed)
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

  function setProposalRead (p: Proposal) {
    userReadProposals.add(p.pk)
  }

  /* Ignore retracted, denied or unhandled proposals (states not in default filter) */
  function filterHidesUnread (ai: number, lastRead: Date | undefined, filter: ProposalFilter): boolean {
    for (const p of iterProposals(p => p.agenda_item === ai)) {
      if (
        (lastRead && p.created > lastRead) &&
        DEFAULT_FILTER_STATES.includes(p.state) &&
        !filter(p)
      ) return true
    }
    return false
  }

  /* Ignore retracted, denied or unhandled proposals (states not in default filter) */
  function agendaItemAllRead (ai: number, lastRead?: Date): boolean {
    for (const p of iterProposals(p => p.agenda_item === ai)) {
      if (
        (lastRead && p.created > lastRead) &&
        !userReadProposals.has(p.pk) &&
        DEFAULT_FILTER_STATES.includes(p.state)
      ) return false
    }
    return true
  }

  return {
    agendaItemHasProposals,
    agendaItemAllRead,
    filterHidesUnread,
    getAgendaProposals,
    getPollProposals,
    getProposal,
    setProposalRead
  }
}
