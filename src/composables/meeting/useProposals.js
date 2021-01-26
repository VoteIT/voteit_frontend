import { ref } from 'vue'
import useChannels from '../useChannels.js'
import useContentApi from '../useContentApi.js'

const proposals = ref([])

useChannels('proposal')
  .onChanged(item => {
    const index = proposals.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) proposals.value[index] = item
    else proposals.value.push(item)
  })
  .onDeleted(item => {
    const index = proposals.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) proposals.value.splice(index, 1)
  })

export default function useProposals () {
  const pollApi = useContentApi('proposal')

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
    return pollApi.list({ agenda_item: agendaId })
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
      pollApi.list({ polls: pk })
        .then(({ data }) => {
          setProposals(data)
        })
    }
    return props
  }

  function clearAgenda (agendaPk) {
    proposals.value = proposals.value.filter(
      p => p.agenda_item !== agendaPk)
  }

  return {
    fetchAgendaProposals,
    getAgendaProposals,
    getPollProposals,
    clearAgenda
  }
}
