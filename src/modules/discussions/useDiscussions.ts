import { filter } from 'itertools'
import { reactive } from 'vue'

// import { agendaItemType } from '../agendas/contentTypes'
// import { agendaDeletedEvent } from '../agendas/events'
import { Proposal } from '../proposals/types'

import { discussionPostType } from './contentTypes'
import { DiscussionPost } from './types'

const discussions = reactive<Map<number, DiscussionPost>>(new Map())

discussionPostType.updateMap(discussions, { agenda_item: 'agenda_item' })

// function deleteForAgendaItem (uriOrPk: number | string) {
//   const pk = typeof uriOrPk === 'string' ? Number(uriOrPk.split('/')[1]) : uriOrPk
//   for (const post of discussions.values()) {
//     if (post.agenda_item === pk) {
//       discussions.delete(post.pk)
//     }
//   }
// }
// Automatically clear discussions for deleted (or made private) agenda_items
// agendaDeletedEvent.on(deleteForAgendaItem)
// Automatically clear discussions for agenda item when unsubscribed
// agendaItemType.channel.onLeave(deleteForAgendaItem)

function getAgendaDiscussions(
  agendaItem: number,
  _filter?: (d: DiscussionPost) => boolean
) {
  return filter(
    discussions.values(),
    (post) => post.agenda_item === agendaItem && (!_filter || _filter(post))
  )
}

function getProposalDiscussions(proposal: Proposal) {
  return filter(discussions.values(), (post) =>
    post.tags.includes(proposal.prop_id)
  )
}

export default function useDiscussions() {
  return {
    getAgendaDiscussions,
    getProposalDiscussions
  }
}
