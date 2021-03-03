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
      if (ai && ai.meeting === meeting) {
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
  function getAgendaProposals (agendaPk: number, state?: ProposalState): Proposal[] {
    const props = [...wu(proposals.values()).filter(
      p => p.agenda_item === agendaPk && (!state || p.state === state)
    )]
    return orderBy(props) as Proposal[]
  }

  function getPollProposals (poll: Poll): Proposal[] {
    // TODO: Send proposal ids with poll data and do poll.proposals.map() instead.
    const props = [...wu(proposals.values()).filter(
      p => p.polls.includes(poll.pk)
    )]
    return orderBy(props) as Proposal[]
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
