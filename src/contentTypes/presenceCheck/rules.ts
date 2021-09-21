import { Meeting, Predicate, PresenceCheck } from '../types'
import meetingRules from '../meeting/rules'
import { meetings } from '@/modules/meetings/useMeetings'
import { PresenceCheckState } from './workflowStates'

const isOpen: Predicate = (check: PresenceCheck) => {
  return check.state === PresenceCheckState.Open
}

const canAdd: Predicate = (meeting: Meeting) => {
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting)
}

const canChange: Predicate = (check: PresenceCheck) => {
  const meeting = meetings.get(check.meeting)
  return !!meeting && meetingRules.isModerator(meeting) && isOpen(check)
}

export default {
  canAdd,
  canChange
}
