import { filter, Predicate } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { Proposal } from '../proposals/types'
import { discussionPostType } from './contentTypes'
import { DiscussionPost } from './types'

export default defineStore('discussions', () => {
  const discussions = reactive(new Map<number, DiscussionPost>())

  discussionPostType.updateMap(discussions, { agenda_item: 'agenda_item' })

  function filterDiscussions(predicate: Predicate<DiscussionPost>) {
    return filter(discussions.values(), predicate)
  }

  function getProposalDiscussions({ agenda_item, prop_id }: Proposal) {
    return filterDiscussions(
      (post) => post.agenda_item === agenda_item && post.tags.includes(prop_id)
    )
  }

  return {
    filterDiscussions,
    getProposalDiscussions
  }
})
