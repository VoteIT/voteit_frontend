import { mapFilter, orderBy } from '@/utils'
import { reactive } from 'vue'
import useAuthentication from '@/composables/useAuthentication'
import { reactionButtonType, reactionType } from './contentTypes'
import { Reaction, ReactionButton, ReactionCountMessage, ReactionListMessage, ReactionRelation } from './types'

function getCountKey (contentType: string, objectId: number, button: number) {
  return `${contentType}/${objectId}/${button}`
}

export const reactionButtons = reactive<Map<number, ReactionButton>>(new Map())
const reactions = reactive<Map<number, Reaction>>(new Map())
const reactionCounts = reactive<Map<string, number>>(new Map())

const { user } = useAuthentication()

reactionButtonType.updateMap(reactionButtons)
reactionType.updateMap(reactions)
  .on<ReactionCountMessage>('count', payload => {
    const key = getCountKey(payload.content_type, payload.object_id, payload.button)
    reactionCounts.set(key, payload.count)
  })

export default function useReactions () {
  function getMeetingButtons (meeting: number, contentType?: string) {
    const buttons = [...mapFilter(
      reactionButtons,
      b => b.meeting === meeting && (!contentType || b.allowed_models.includes(contentType))
    )]
    return orderBy(buttons, 'order')
  }

  function getButtonReactionCount (button: ReactionButton, relation: ReactionRelation): number {
    const key = getCountKey(relation.content_type, relation.object_id, button.pk)
    return reactionCounts.get(key) || 0
  }

  function getUserReaction (button: ReactionButton, relation: ReactionRelation): Reaction | void {
    for (const r of reactions.values()) {
      if (r.button === button.pk &&
          r.content_type === relation.content_type &&
          r.object_id === relation.object_id &&
          r.user === user.value?.pk
      ) return r
    }
  }

  function setUserReacted (button: ReactionButton, relation: ReactionRelation) {
    return reactionType.add({
      button: button.pk,
      ...relation,
      user: user.value?.pk
    })
  }

  function removeUserReacted (button: ReactionButton, relation: ReactionRelation) {
    const reaction = getUserReaction(button, relation)
    if (reaction) {
      return reactionType.delete(reaction.pk)
    } else {
      return Promise.reject(new Error('User has no previous reaction'))
    }
  }

  async function fetchReactions (button: ReactionButton, relation: ReactionRelation) {
    const { p } = await reactionType.methodCall<ReactionListMessage>('list', {
      button: button.pk,
      ...relation
    })
    return p
  }

  return {
    fetchReactions,
    getMeetingButtons,
    getButtonReactionCount,
    getUserReaction,
    setUserReacted,
    removeUserReacted
  }
}
