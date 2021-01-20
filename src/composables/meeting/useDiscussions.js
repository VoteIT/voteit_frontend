import { ref } from 'vue'

import { restApi } from '@/utils'

import useChannels from '../useChannels'

const discussions = ref([])

useChannels('discussion_post')
  .onChange(item => {
    const index = discussions.value.findIndex(d => d.pk === item.pk)
    if (index !== -1) discussions.value[index] = item
    else discussions.value.push(item)
  })
  .onDelete(item => {
    const index = discussions.value.findIndex(d => d.pk === item.pk)
    if (index !== -1) discussions.value.splice(index, 1)
  })

export default function useDiscussions () {
  async function fetchAgendaDiscussions (agendaPk) {
    const params = { agenda_item: agendaPk }
    return restApi.get('discussion-posts/', { params })
      .then(({ data }) => {
        discussions.value = discussions.value.filter(d => d.agenda_item !== agendaPk)
        Array.prototype.push.apply(discussions.value, data)
      })
  }

  function getAgendaDiscussions (agendaPk) {
    return discussions.value.filter(d => d.agenda_item === agendaPk)
  }

  function clearAgenda (agendaPk) {
    discussions.value = discussions.value.filter(
      d => d.agenda_item !== agendaPk)
  }

  return {
    fetchAgendaDiscussions,
    getAgendaDiscussions,
    clearAgenda
  }
}
