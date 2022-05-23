import { PresenceCheckState } from '@/modules/presence/workflowStates'
import { PresenceCheck } from '@/contentTypes/types'
import { isActiveMeeting, isModerator } from '../meetings/rules'
import { Meeting } from '../meetings/types'

function isOpenPresenceCheck (check: PresenceCheck): boolean {
  return check.state === PresenceCheckState.Open
}

export function canAddPresenceCheck (meeting: Meeting): boolean {
  return !!isModerator(meeting) && isActiveMeeting(meeting)
}

export function canChangePresenceCheck (check: PresenceCheck): boolean {
  return !!isModerator(check.meeting) && isOpenPresenceCheck(check)
}
