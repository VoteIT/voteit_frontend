import { PresenceCheckState } from '@/modules/presence/workflowStates'
import { PresenceCheck } from '@/contentTypes/types'
import { isActiveMeeting, isModerator } from '../meetings/rules'
import { Meeting } from '../meetings/types'
import { meetings } from '../meetings/useMeetings'

function isOpenPresenceCheck (check: PresenceCheck): boolean {
  return check.state === PresenceCheckState.Open
}

export function canAddPresenceCheck (meeting: Meeting): boolean {
  return isModerator(meeting) && isActiveMeeting(meeting)
}

export function canChangePresenceCheck (check: PresenceCheck): boolean {
  const meeting = meetings.get(check.meeting)
  return !!meeting && isModerator(meeting) && isOpenPresenceCheck(check)
}
