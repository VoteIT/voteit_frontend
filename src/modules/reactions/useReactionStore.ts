import { ifilter, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import useAuthStore from '../auth/useAuthStore'
import { ProposalButtonMode } from '../proposals/types'
import { reactionButtonType, reactionType } from './contentTypes'
import {
  isFlagButton,
  ReactionListMessage,
  type Reaction,
  type ReactionButton,
  type ReactionCountMessage,
  type ReactionRelation
} from './types'

function getCountKey(contentType: string, objectId: number, button: number) {
  return `${contentType}/${objectId}/${button}`
}

export default defineStore('reactions', () => {
  const authStore = useAuthStore()

  const reactionButtons = reactive<Map<number, ReactionButton>>(new Map())
  const reactions = reactive<Map<number, Reaction>>(new Map())
  const reactionCounts = reactive<Map<string, number>>(new Map())

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

  function iterMeetingButtons(
    meeting: number,
    contentType?: string,
    mode?: ProposalButtonMode
  ) {
    return ifilter(reactionButtons.values(), (b) => {
      if (b.meeting !== meeting) return false
      if (contentType && !b.allowed_models.includes(contentType)) return false
      if (mode === 'voteTemplate') return b.vote_template
      if (mode && !b[`on_${mode}`]) return false
      return true
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

  function getUserReaction(
    button: ReactionButton,
    relation: ReactionRelation
  ): Reaction | void {
    for (const r of reactions.values())
      if (
        r.button === button.pk &&
        r.content_type === relation.content_type &&
        r.object_id === relation.object_id &&
        r.user === useAuthStore().user?.pk
      )
        return r
  }

  function setUserReacted(button: ReactionButton, relation: ReactionRelation) {
    if (!authStore.user)
      throw new Error('Authenticated user required for reactions')
    return reactionType.add({
      button: button.pk,
      ...relation,
      user: authStore.user.pk
    })
  }

  async function removeUserReacted(
    button: ReactionButton,
    relation: ReactionRelation
  ) {
    if (isFlagButton(button))
      return await reactionType.methodCall('delete_flag', {
        button: button.pk,
        ...relation
      })
    const reaction = getUserReaction(button, relation)
    if (!reaction) throw new Error('User has no previous reaction')
    return await reactionType.delete(reaction.pk)
  }

  async function fetchReactions(
    button: ReactionButton,
    relation: ReactionRelation
  ) {
    const { p } = await reactionType.methodCall<ReactionListMessage>('list', {
      button: button.pk,
      ...relation
    })
    return p
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
