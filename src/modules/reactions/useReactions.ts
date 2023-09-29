import { filter } from 'itertools'
import { sortBy } from 'lodash'
import { reactive } from 'vue'

import useAuthentication from '@/composables/useAuthentication'

import { reactionButtonType, reactionType } from './contentTypes'
import { Reaction, ReactionButton, ReactionCountMessage, ReactionListMessage, ReactionRelation, isFlagButton } from './types'
import { ProposalButtonMode } from '../proposals/types'

function getCountKey (contentType: string, objectId: number, button: number) {
  return `${contentType}/${objectId}/${button}`
}

export const reactionButtons = reactive<Map<number, ReactionButton>>(new Map())
const reactions = reactive<Map<number, Reaction>>(new Map())
const reactionCounts = reactive<Map<string, number>>(new Map())

const { user } = useAuthentication()

reactionButtonType.updateMap(
  reactionButtons,
  { meeting: 'meeting' }
)
reactionType.updateMap(
  reactions,
  { agenda_item: 'agenda_item' }
)
  .on<ReactionCountMessage>('count', payload => {
    const key = getCountKey(payload.content_type, payload.object_id, payload.button)
    reactionCounts.set(key, payload.count)
  })


function getMeetingButtons (meeting: number, contentType?: string, mode?: ProposalButtonMode) {
  return sortBy(
    filter(
      reactionButtons.values(),
      b => {
        if (b.meeting !== meeting) return false
        if (contentType && !b.allowed_models.includes(contentType)) return false
        if (mode && !b[`on_${mode}`]) return false
        return true
      }
    ),
    'order'
  )
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

async function removeUserReacted (button: ReactionButton, relation: ReactionRelation) {
  if (isFlagButton(button)) {
    await reactionType.methodCall('delete_flag', { button: button.pk, ...relation })
    return
  }
  const reaction = getUserReaction(button, relation)
  if (!reaction) throw new Error('User has no previous reaction')
  await reactionType.delete(reaction.pk)
}

async function fetchReactions (button: ReactionButton, relation: ReactionRelation) {
  const { p } = await reactionType.methodCall<ReactionListMessage>('list', {
    button: button.pk,
    ...relation
  })
  return p
}

export default function useReactions () {
  return {
    fetchReactions,
    getMeetingButtons,
    getButtonReactionCount,
    getUserReaction,
    setUserReacted,
    removeUserReacted
  }
}
