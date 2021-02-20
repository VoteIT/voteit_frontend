import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import proposalType from '@/contentTypes/proposal'

const proposals = reactive(new Map())

proposalType.useChannels()
  .updateMap(proposals, dateify)

// Automatically clear proposals for agenda item when unsubscribed,
// unless they have polls. (!)
agendaItemType.useChannels()
  .onLeave(agendaPk => {
    for (const p of proposals.values()) {
      if (p.agenda_item === agendaPk && !p.polls.length) {
        proposals.delete(p.pk)
      }
    }
  })

const proposalApi = proposalType.useContentApi()

export default function useProposals () {
  function setProposals (props) {
    props.forEach(p => {
      proposals.set(p.pk, dateify(p))
    })
  }

  function getAgendaProposals (agendaPk, wfState) {
    const props = [...wu(proposals.values()).filter(
      p => p.agenda_item === agendaPk && (!wfState || p.state === wfState)
    )]
    return orderBy(props)
  }

  function getPollProposals (pk) {
    // TODO Rewrite this. Should probably ensure all proposals are returned.
    const props = [...wu(proposals.values()).filter(
      p => p.polls.includes(pk)
    )]
    if (!props.length) {
      proposalApi.list({ polls: pk })
        .then(({ data }) => {
          setProposals(data)
        })
    }
    return orderBy(props)
  }

  return {
    getAgendaProposals,
    getPollProposals
  }
}
