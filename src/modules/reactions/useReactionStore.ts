import { ifilter, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

import useAuthStore from '../auth/useAuthStore'
import { ProposalButtonMode } from '../proposals/types'
import { reactionButtonType, reactionType } from './contentTypes'
import type {
  Reaction,
  ReactionButton,
  ReactionCountMessage,
  ReactionRelation
} from './types'

function getCountKey(contentType: string, objectId: number, button: number) {
  return `${contentType}/${objectId}/${button}`
}

export default defineStore('reactions', () => {
  const reactionButtons = shallowReactive(new Map<number, ReactionButton>())
  const reactions = shallowReactive(new Map<number, Reaction>())
  const reactionCounts = shallowReactive(new Map<string, number>())

  reactionButtonType.updateMap(reactionButtons, { meeting: 'meeting' })
  reactionType
    .updateMap(reactions, { agenda_item: 'agenda_item' })
    .on<ReactionCountMessage>('count', (payload) => {
      const key = getCountKey(
        payload.content_type,
        payload.object_id,
        payload.button
      )
      reactionCounts.set(key, payload.count)
    })

  const authStore = useAuthStore()

  function iterMeetingButtons(
    meeting: number,
    contentType?: string,
    mode?: ProposalButtonMode
  ) {
    return ifilter(reactionButtons.values(), (b) => {
      if (b.meeting !== meeting) return false
      if (contentType && !b.allowed_models.includes(contentType)) return false
      switch (mode) {
        case 'presentation':
        case 'vote':
          return b[`on_${mode}`]
        case 'vote:template':
          return b.vote_template
        default:
          return true
      }
    })
  }

  /**
   * Get filtered buttons for a meeting, based on content type and proposal button mode
   */
  function getMeetingButtons(
    meeting: number,
    contentType?: string,
    mode?: ProposalButtonMode
  ) {
    return sorted(
      iterMeetingButtons(meeting, contentType, mode),
      (b) => b.order
    )
  }

  function getButton(button: number) {
    return reactionButtons.get(button)
  }

  function getButtonReactionCount(
    button: ReactionButton,
    relation: ReactionRelation
  ): number {
    const key = getCountKey(
      relation.content_type,
      relation.object_id,
      button.pk
    )
    return reactionCounts.get(key) ?? 0
  }

  function getUserReaction(button: ReactionButton, relation: ReactionRelation) {
    for (const r of reactions.values())
      if (
        r.button === button.pk &&
        r.content_type === relation.content_type &&
        r.object_id === relation.object_id &&
        r.user === useAuthStore().user?.pk
      )
        return r
  }

  async function setUserReacted(
    button: ReactionButton,
    relation: ReactionRelation
  ) {
    if (!authStore.user)
      throw new Error('Authenticated user required for reactions')
    const data = await reactionButtonType.api.action<Reaction>(
      'set',
      button.pk,
      relation
    )
    reactions.set(data.pk, data)
    return data
  }

  async function removeUserReacted(
    button: ReactionButton,
    relation: ReactionRelation
  ) {
    await reactionButtonType.api.action('remove', button.pk, relation)
    const reaction = getUserReaction(button, relation)
    if (reaction) reactions.delete(reaction.pk)
  }

  async function fetchReactions(
    button: ReactionButton,
    relation: ReactionRelation
  ) {
    const data = await reactionButtonType.api.action<{ users: number[] }>(
      'list-reactions',
      button.pk,
      relation
    )
    return data
  }

  return {
    fetchReactions,
    getButton,
    getButtonReactionCount,
    getMeetingButtons,
    getUserReaction,
    iterMeetingButtons,
    removeUserReacted,
    setUserReacted
  }
})
