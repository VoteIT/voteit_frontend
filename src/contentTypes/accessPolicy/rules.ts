import { meetings } from '@/modules/meetings/useMeetings'
import { AccessPolicy, AccessPolicyType, Predicate } from '../types'

import meetingRules from '../meeting/rules'

function baseCheck (accessPolicy: AccessPolicy) {
  if (!accessPolicy.active) return false // Unnecessary atm; will not get inactive from API
  const meeting = meetings.get(accessPolicy.meeting)
  return !!meeting && meeting.public && !meetingRules.isParticipant(meeting)
}

const canJoin: Predicate = (accessPolicy: AccessPolicy) => {
  return baseCheck(accessPolicy) && accessPolicy.name === AccessPolicyType.Automatic
}

const canApply: Predicate = (accessPolicy: AccessPolicy) => {
  return baseCheck(accessPolicy) && accessPolicy.name === AccessPolicyType.ModeratorApproved
}

export default {
  canJoin,
  canApply
}
