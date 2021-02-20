import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'

const discussions = reactive(new Map())

discussionPostType.useChannels()
  .updateMap(discussions, dateify)

// Automatically clear proposals for agenda item when unsubscribed
agendaItemType.useChannels().onLeave(agendaPk => {
  for (const post of discussions.values()) {
    if (post.agenda_item === agendaPk) {
      discussions.delete(post.pk)
    }
  }
})

export default function useDiscussions () {
  function getAgendaDiscussions (agendaPk) {
    const posts = [...wu(discussions.values()).filter(post => post.agenda_item === agendaPk)]
    return orderBy(posts)
  }

  return {
    getAgendaDiscussions
  }
}
