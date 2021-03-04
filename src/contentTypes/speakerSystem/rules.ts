import { Meeting, SpeakerSystem, SpeakerSystemRole } from '../types'
import meetingRules from '../meeting/rules'
import useContextRoles from '@/composables/useContextRoles'
import { meetings } from '@/composables/useMeetings'
import { SpeakerSystemState } from './workflowStates'
import useAuthentication from '@/composables/useAuthentication'

const { hasRole } = useContextRoles('speaker_system')
const { user } = useAuthentication()

function isSpeaker (system: SpeakerSystem) {
  return hasRole(system.pk, SpeakerSystemRole.Speaker)
}

function isModerator (system: SpeakerSystem) {
  return hasRole(system.pk, SpeakerSystemRole.ListModerator)
}

function isArchived (system: SpeakerSystem) {
  return system.state === SpeakerSystemState.Archived
}

function isActive (system: SpeakerSystem) {
  return system.state === SpeakerSystemState.Active
}

function canAdd (meeting: Meeting) {
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting)
}

function canDelete (system: SpeakerSystem) {
  const meeting = meetings.get(system.meeting)
  return isModerator(system) && meetingRules.isActive(meeting) && !isArchived(system)
}

export default {
  isActive,
  isArchived,
  isModerator,
  isSpeaker,

  canAdd,
  canDelete
}
