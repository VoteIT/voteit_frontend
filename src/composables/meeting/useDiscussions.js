import { ref } from 'vue'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'

const discussions = ref([])

discussionPostType.useChannels()
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
agendaItemType.useChannels().onLeave(agendaPk => {
  discussions.value = discussions.value.filter(
    d => d.agenda_item !== agendaPk
  )
})

export default function useDiscussions () {
  function getAgendaDiscussions (agendaPk) {
    return discussions.value.filter(d => d.agenda_item === agendaPk)
  }

  return {
    getAgendaDiscussions
  }
}
