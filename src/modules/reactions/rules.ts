import { reactionButtons } from '@/modules/reactions/useReactions'

import { Reaction, ReactionButton } from './types'
import { meetingType } from '../meetings/contentTypes'

const { hasRole } = meetingType.useContextRoles()

export function canAddReaction (button: ReactionButton): boolean {
  return button.active && hasRole(button.meeting, button.change_roles)
}

export function canDeleteReaction (reaction: Reaction): boolean {
  const button = reactionButtons.get(reaction.button)
  return button ? canAddReaction(button) : false
}

export function canListReactions (button: ReactionButton): boolean {
  return hasRole(button.meeting, button.list_roles)
}
