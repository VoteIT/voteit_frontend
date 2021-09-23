import { reactive } from 'vue'

import { dateify, mapFilter, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import { DiscussionPost, Proposal } from '@/contentTypes/types'
import { agendaDeletedEvent } from '@/modules/agendas/useAgenda'

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

function orderedDiscussions (filter: (d: DiscussionPost) => boolean) {
  return orderBy([...mapFilter(discussions, filter)])
}

export default function useDiscussions () {
  function getAgendaDiscussions (agendaItem: number, filter?: (d: DiscussionPost) => boolean) {
    return orderedDiscussions(
      post => post.agenda_item === agendaItem && (!filter || filter(post))
    )
  }

  function getProposalDiscussions (proposal: Proposal) {
    return orderedDiscussions(
      post => post.tags.includes(proposal.prop_id)
    )
  }

  return {
    getAgendaDiscussions,
    getProposalDiscussions
  }
}
