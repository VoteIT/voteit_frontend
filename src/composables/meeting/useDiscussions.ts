import { reactive } from 'vue'
import wu from 'wu'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import { DiscussionPost } from '@/contentTypes/types'
import { agendaDeletedEvent } from './useAgenda'

const discussions = reactive<Map<number, DiscussionPost>>(new Map())

discussionPostType.getChannel()
  .updateMap(discussions, dateify)

function deleteForAgendaItem (uriOrPk: number | string) {
  const pk = typeof uriOrPk === 'string' ? Number(uriOrPk.split('/')[1]) : uriOrPk
  for (const post of discussions.values()) {
    if (post.agenda_item === pk) {
      discussions.delete(post.pk)
    }
  }
}
// Automatically clear proposals for deleted (or made private) agenda_items
agendaDeletedEvent.on(deleteForAgendaItem)
// Automatically clear proposals for agenda item when unsubscribed
agendaItemType.getChannel().onLeave(deleteForAgendaItem)

export default function useDiscussions () {
  function getAgendaDiscussions (agendaItem: number) {
    const posts = [...wu(discussions.values()).filter(post => post.agenda_item === agendaItem)]
    return orderBy(posts)
  }

  return {
    getAgendaDiscussions
  }
}
