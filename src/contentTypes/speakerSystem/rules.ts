import { Meeting, SpeakerSystem } from '../types'
import meetingRules from '../meeting/rules'
import useContextRoles from '@/composables/useContextRoles'
import { meetings } from '@/composables/useMeetings'

const { hasRole } = useContextRoles('speaker_system')

function isSpeaker (system: SpeakerSystem) {
  return false
}

function isModerator (system: SpeakerSystem) {
  return false
}

function isArchived (system: SpeakerSystem) {
  return system.archived
}

function canAdd (meeting: Meeting) {
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting)
}

function canDelete (system: SpeakerSystem) {
  const meeting = meetings.get(system.meeting)
  return isModerator(system) && meetingRules.isActive(meeting) && !isArchived(system)
}

export default {
  canAdd,
  canDelete
}
