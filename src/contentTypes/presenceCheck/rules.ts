import { Meeting, predicate, PresenceCheck } from '../types'
import meetingRules from '../meeting/rules'
import { meetings } from '@/composables/useMeetings'
import { PresenceCheckState } from './workflowStates'

const isOpen: predicate = (check: PresenceCheck) => {
  return check.state === PresenceCheckState.Open
}

const canAdd: predicate = (meeting: Meeting) => {
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting)
}

const canChange: predicate = (check: PresenceCheck) => {
  const meeting = meetings.get(check.meeting)
  return !!meeting && meetingRules.isModerator(meeting) && isOpen(check)
}

export default {
  canAdd,
  canChange
}
