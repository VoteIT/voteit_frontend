import { reactive } from 'vue'

import { mapFilter } from '@/utils'

import { agendaItemType } from '../agendas/contentTypes'
import { agendaDeletedEvent } from '../agendas/events'
import { Proposal } from '../proposals/types'

import { discussionPostType } from './contentTypes'
import { DiscussionPost } from './types'

const discussions = reactive<Map<number, DiscussionPost>>(new Map())

discussionPostType.updateMap(discussions)

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
agendaItemType.channel.onLeave(deleteForAgendaItem)

export default function useDiscussions () {
  function getAgendaDiscussions (agendaItem: number, filter?: (d: DiscussionPost) => boolean) {
    return [...mapFilter(
      discussions,
      post => post.agenda_item === agendaItem && (!filter || filter(post))
    )]
  }

  function getProposalDiscussions (proposal: Proposal) {
    return [...mapFilter(
      discussions,
      post => post.tags.includes(proposal.prop_id)
    )]
  }

  return {
    getAgendaDiscussions,
    getProposalDiscussions
  }
}
