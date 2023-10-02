import { meetingType } from '../meetings/contentTypes'
import { MeetingRole } from '../meetings/types'

import { reactionButtons } from './useReactions'
import { Reaction, ReactionButton, isFlagButton } from './types'

const { hasRole } = meetingType.useContextRoles()

export function canAddReaction (button: ReactionButton): boolean {
  const required = isFlagButton(button)
    ? MeetingRole.Moderator
    : button.change_roles
  return button.active && !!hasRole(button.meeting, required)
}

export function canDeleteReaction (reaction: Reaction): boolean {
  const button = reactionButtons.get(reaction.button)
  return !!button && canAddReaction(button)
}

export function canListReactions (button: ReactionButton): boolean {
  return !!hasRole(button.meeting, button.list_roles)
}
