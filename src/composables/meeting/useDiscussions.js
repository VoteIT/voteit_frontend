import { ref } from 'vue'

import { restApi, dateify, orderBy } from '@/utils'

import useChannels from '../useChannels'

const discussions = ref([])

useChannels('discussion_post')
  .onChanged(item => {
    dateify(item)
    const index = discussions.value.findIndex(d => d.pk === item.pk)
    if (index !== -1) discussions.value[index] = item
    else discussions.value.push(item)
    orderBy(discussions.value)
  })
  .onDeleted(item => {
    const index = discussions.value.findIndex(d => d.pk === item.pk)
    if (index !== -1) discussions.value.splice(index, 1)
  })

// Automatically clear proposals for agenda item when unsubscribed
useChannels('agenda_item').onLeave(agendaPk => {
  discussions.value = discussions.value.filter(
    d => d.agenda_item !== agendaPk
  )
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

  return {
    fetchAgendaDiscussions,
    getAgendaDiscussions
  }
}
