import { ref, toRef } from 'vue'

import { PresenceCheckState } from '@/modules/presence/workflowStates'
import { PresenceCheck } from '@/contentTypes/types'
import { isActiveMeeting, isModerator } from '../meetings/rules'
import type { Meeting } from '../meetings/types'
import useMeetingComponent from '../meetings/useMeetingComponent'

function isActivePresenceComponent(meeting: Meeting | number) {
  const meetingId =
    typeof meeting === 'number' ? ref(meeting) : toRef(meeting, 'pk')
  return useMeetingComponent(meetingId, 'presence_check').componentActive.value
}

function isOpenPresenceCheck(check: PresenceCheck): boolean {
  return check.state === PresenceCheckState.Open
}

export function canAddPresenceCheck(meeting: Meeting | number): boolean {
  return (
    !!isModerator(meeting) &&
    isActiveMeeting(meeting) &&
    isActivePresenceComponent(meeting)
  )
}

export function canChangePresenceCheck(check: PresenceCheck): boolean {
  return (
    !!isModerator(check.meeting) &&
    isOpenPresenceCheck(check) &&
    isActivePresenceComponent(check.meeting)
  )
}
