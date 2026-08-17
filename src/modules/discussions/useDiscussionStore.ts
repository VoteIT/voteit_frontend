import { filter } from 'itertools'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

import IndexedMap from '@/utils/IndexedMap'
import { Predicate } from '@/utils/types'
import { Proposal } from '../proposals/types'
import { discussionPostType } from './contentTypes'
import { DiscussionPost } from './types'

export default defineStore('discussions', () => {
  const discussions = shallowReactive(
    new IndexedMap<DiscussionPost, 'agenda_item'>({
      agenda_item: (d) => d.agenda_item
    })
  )

  discussionPostType.updateMap(discussions, { agenda_item: 'agenda_item' })

  function filterDiscussions(predicate: Predicate<DiscussionPost>) {
    return filter(discussions.values(), predicate)
  }

  /**
   * Get the discussion posts of an agenda item
   */
  function getAiDiscussions(
    agendaItem: number,
    predicate?: Predicate<DiscussionPost>
  ) {
    return filter(
      discussions.iterBy('agenda_item', agendaItem),
      (post) => !predicate || predicate(post)
    )
  }

  function getProposalDiscussions({ agenda_item, prop_id }: Proposal) {
    return getAiDiscussions(agenda_item, (post) => post.tags.includes(prop_id))
  }

  return {
    filterDiscussions,
    getAiDiscussions,
    getProposalDiscussions
  }
})
