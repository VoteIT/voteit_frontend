import { meetingType } from '../meetings/contentTypes'
import { MeetingRole } from '../meetings/types'

import { reactionButtons } from './useReactions'
import { Reaction, ReactionButton, isFlagButton } from './types'
import { isActiveMeeting } from '../meetings/rules'

const { hasRole } = meetingType.useContextRoles()

export function canAddReaction (button: ReactionButton): boolean {
  if (!isActiveMeeting(button.meeting) || !button.active) return false
  const required = isFlagButton(button)
    ? MeetingRole.Moderator
    : button.change_roles
  return !!hasRole(button.meeting, required)
}

export function canDeleteReaction (reaction: Reaction): boolean {
  const button = reactionButtons.get(reaction.button)
  return !!button && canAddReaction(button)
}

export function canListReactions (button: ReactionButton): boolean {
  return !!hasRole(button.meeting, button.list_roles)
}
