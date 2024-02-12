import { AccessPolicy, AccessPolicyType } from '@/contentTypes/types'
import { meetings } from '@/modules/meetings/useMeetings'
import { isParticipant } from '../rules'

function baseCheck(accessPolicy: AccessPolicy) {
  if (!accessPolicy.active) return false // Unnecessary atm; will not get inactive from API
  const meeting = meetings.get(accessPolicy.meeting)
  return !!meeting && meeting.visible_in_lists && !isParticipant(meeting)
}

export function canJoin(accessPolicy: AccessPolicy): boolean {
  return (
    baseCheck(accessPolicy) && accessPolicy.name === AccessPolicyType.Automatic
  )
}

export function canApply(accessPolicy: AccessPolicy): boolean {
  return (
    baseCheck(accessPolicy) &&
    accessPolicy.name === AccessPolicyType.ModeratorApproved
  )
}
