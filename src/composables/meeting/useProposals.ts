import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import proposalType from '@/contentTypes/proposal'
import { Poll } from '@/contentTypes/types'

const proposals = reactive(new Map())

proposalType.useChannels()
  .updateMap(proposals, dateify)

// Automatically clear proposals for agenda item when unsubscribed.
agendaItemType.useChannels()
  .onLeave(agendaPk => {
    for (const p of proposals.values()) {
      if (p.agenda_item === agendaPk) {
        proposals.delete(p.pk)
      }
    }
  })

export default function useProposals () {
  function getAgendaProposals (agendaPk: number, wfState: string) {
    const props = [...wu(proposals.values()).filter(
      p => p.agenda_item === agendaPk && (!wfState || p.state === wfState)
    )]
    return orderBy(props)
  }

  function getPollProposals (poll: Poll) {
    // TODO: Send proposal ids with poll data and do poll.proposals.map() instead.
    const props = [...wu(proposals.values()).filter(
      p => p.polls.includes(poll.pk)
    )]
    return orderBy(props)
  }

  return {
    getAgendaProposals,
    getPollProposals
  }
}
