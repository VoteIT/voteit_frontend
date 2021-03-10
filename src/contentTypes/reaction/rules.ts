import useContextRoles from '@/composables/useContextRoles'
import { reactionButtons } from '@/composables/meeting/useReactions'

import { predicate } from '../types'
import { ReactionButton } from '../reactionButton'

import { Reaction } from '.'

const { hasRole } = useContextRoles('meeting')

const canAdd: predicate = (button: ReactionButton) => {
  return button.active && hasRole(button.meeting, button.change_roles)
}

const canDelete: predicate = (reaction: Reaction) => {
  const button = reactionButtons.get(reaction.button)
  return button ? canAdd(button) : false
}

const canList: predicate = (button: ReactionButton) => {
  return hasRole(button.meeting, button.list_roles)
}

export default {
  canAdd,
  canDelete,
  canList
}
