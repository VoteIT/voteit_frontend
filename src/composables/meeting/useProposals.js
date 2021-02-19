import { ref } from 'vue'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import proposalType from '@/contentTypes/proposal'

const proposals = ref([])

proposalType.useChannels()
  .onChanged(item => {
    dateify(item)
    const index = proposals.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) proposals.value[index] = item
    else proposals.value.push(item)
    orderBy(proposals.value)
  })
  .onDeleted(item => {
    const index = proposals.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) proposals.value.splice(index, 1)
  })

// Automatically clear proposals for agenda item when unsubscribed
agendaItemType.useChannels()
  .onLeave(agendaPk => {
    proposals.value = proposals.value.filter(
      d => d.agenda_item !== agendaPk
    )
  })

const proposalApi = proposalType.useContentApi()

export default function useProposals () {
  function setProposals (ps) {
    ps.forEach(newProp => {
      const index = proposals.value.findIndex(p => p.pk === newProp.pk)
      if (index !== -1) {
        proposals.value[index] = newProp
      } else {
        proposals.value.push(newProp)
      }
    })
  }

  async function fetchAgendaProposals (agendaId) {
    return proposalApi.list({ agenda_item: agendaId })
      .then(({ data }) => {
        // Clean up any previously set proposals for this agenda item
        proposals.value = proposals.value.filter(p => p.agenda_item !== agendaId)
        Array.prototype.push.apply(proposals.value, data)
      })
  }

  function getAgendaProposals (agendaId, wfState) {
    return proposals.value.filter(p => {
      if (wfState && p.state !== wfState) {
        return false
      }
      return p.agenda_item === agendaId
    })
  }

  function getPollProposals (pk) {
    const props = proposals.value.filter(p => p.polls.includes(pk))
    if (!props.length) {
      proposalApi.list({ polls: pk })
        .then(({ data }) => {
          setProposals(data)
        })
    }
    return props
  }

  return {
    fetchAgendaProposals,
    getAgendaProposals,
    getPollProposals
  }
}
