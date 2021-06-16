import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import meetingType from '@/contentTypes/meeting'
import proposalType from '@/contentTypes/proposal'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'
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
  function getAgendaProposals (agendaPk: number, filter?: (p: Proposal) => boolean): Proposal[] {
    const props = [...wu(proposals.values()).filter(
      p => p.agenda_item === agendaPk && (!filter || filter(p))
    )]
    return orderBy(props)
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
    getAgendaProposals,
    getPollProposals,
    getProposal
  }
}
