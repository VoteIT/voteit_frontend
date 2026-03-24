import { meetingType } from '../meetings/contentTypes'
import { isActiveMeeting, isModerator } from '../meetings/rules'

import useReactionStore from './useReactionStore'
import { Reaction, ReactionButton, isFlagButton } from './types'

const { hasRole } = meetingType.useContextRoles()

export function canAddReaction(button: ReactionButton): boolean {
  if (!isActiveMeeting(button.meeting) || !button.active) return false
  return isFlagButton(button)
    ? !!isModerator(button.meeting)
    : !!hasRole(button.meeting, button.change_roles)
}

export function canDeleteReaction(reaction: Reaction): boolean {
  const button = useReactionStore().getButton(reaction.button)
  return !!button && canAddReaction(button)
}

export function canListReactions(button: ReactionButton): boolean {
  return !!hasRole(button.meeting, button.list_roles)
}

export function canAddReactionButton(meeting: number): boolean {
  return !!isModerator(meeting) && isActiveMeeting(meeting)
}
