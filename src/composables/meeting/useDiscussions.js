import { ref } from 'vue'
import useChannels from '../useChannels'
import useRestApi from '../useRestApi'

const discussions = ref([])

useChannels().registerUpdateHandler('discussion_post', ({ t, p }) => {
  const item = p.item || p // Can be only a pk
  const index = discussions.value.findIndex(d => d.pk === item.pk)
  switch (t) {
    case 'discussion_post.changed':
    case 'discussion_post.added':
      if (index !== -1) {
        discussions.value.splice(index, 1)
      }
      discussions.value.push(item)
      break
    case 'discussion_post.deleted':
      if (index !== -1) {
        discussions.value.splice(index, 1)
      }
      break
  }
})

export default function useDiscussions () {
  const { restApi } = useRestApi()

  async function fetchAgendaDiscussions (agendaId) {
    const params = { agenda_item: agendaId }
    return restApi.get('discussion-posts/', { params })
      .then(({ data }) => {
        discussions.value = discussions.value.filter(d => d.agenda_item !== agendaId)
        Array.prototype.push.apply(discussions.value, data)
      })
  }

  function getAgendaDiscussions (agendaId) {
    return discussions.value.filter(d => d.agenda_item === agendaId)
  }

  return {
    fetchAgendaDiscussions,
    getAgendaDiscussions
  }
}
