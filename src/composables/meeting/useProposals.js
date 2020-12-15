import { ref } from 'vue'

import { restApi } from '@/utils'

import useChannels from '../useChannels.js'

const proposals = ref([])

useChannels()
  .registerUpdateHandler('proposal', ({ p, t }) => {
    const item = p.item || p // Can be only a pk
    const index = proposals.value.findIndex(p => p.pk === item.pk)
    switch (t) {
      case 'proposal.changed':
      case 'proposal.added':
        if (index !== -1) {
          proposals.value.splice(index, 1)
        }
        proposals.value.push(item)
        break
      case 'proposal.deleted':
        if (index !== -1) {
          proposals.value.splice(index, 1)
        }
        break
    }
  })

export default function useProposals () {
  async function fetchAgendaProposals (agendaId) {
    const params = { agenda_item: agendaId }
    return restApi.get('proposals/', { params })
      .then(({ data }) => {
        // Clean up any previously set proposals for this agenda item
        proposals.value = proposals.value.filter(p => p.agenda_item !== agendaId)
        Array.prototype.push.apply(proposals.value, data)
      })
  }

  function getAgendaProposals (agendaId) {
    return proposals.value.filter(p => p.agenda_item === agendaId)
  }

  return {
    fetchAgendaProposals,
    getAgendaProposals
  }
}
