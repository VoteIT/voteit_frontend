import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'

const discussions = reactive(new Map())

discussionPostType.useChannels()
  .updateMap(discussions, dateify)

// Automatically clear proposals for agenda item when unsubscribed
agendaItemType.useChannels().onLeave(agendaItem => {
  for (const post of discussions.values()) {
    if (post.agenda_item === agendaItem) {
      discussions.delete(post.pk)
    }
  }
})

export default function useDiscussions () {
  function getAgendaDiscussions (agendaItem: number) {
    const posts = [...wu(discussions.values()).filter(post => post.agenda_item === agendaItem)]
    return orderBy(posts)
  }

  return {
    getAgendaDiscussions
  }
}
