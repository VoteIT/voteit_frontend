import useAuthentication from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'
import { meetings } from '@/modules/meetings/useMeetings'
import { currentlySpeaking, speakerLists } from '@/composables/meeting/useSpeakerLists'

import { Meeting, Predicate, SpeakerSystemRole } from '../types'
import meetingRules from '../meeting/rules'

import { SpeakerSystemState } from './workflowStates'
import { SpeakerSystem } from '.'

const { hasRole } = useContextRoles('speaker_system')
const { user } = useAuthentication()

function getActiveList (system: SpeakerSystem) {
  return system.active_list && speakerLists.get(system.active_list)
}

function hasActiveSpeaker (system: SpeakerSystem) {
  const active = getActiveList(system)
  return !!(active && currentlySpeaking.get(active.pk))
}

const isSpeaker: Predicate = (system: SpeakerSystem) => {
  return hasRole(system.pk, SpeakerSystemRole.Speaker)
}

const isModerator: Predicate = (system: SpeakerSystem) => {
  return hasRole(system.pk, SpeakerSystemRole.ListModerator)
}

const isArchived: Predicate = (system: SpeakerSystem) => {
  return system.state === SpeakerSystemState.Archived
}

const isActive: Predicate = (system: SpeakerSystem) => {
  return system.state === SpeakerSystemState.Active
}

const canAdd: Predicate = (meeting: Meeting) => {
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting)
}

const canDelete: Predicate = (system: SpeakerSystem) => {
  const meeting = meetings.get(system.meeting)
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting) && !isArchived(system)
}

export default {
  hasActiveSpeaker,

  isActive,
  isArchived,
  isModerator,
  isSpeaker,

  canAdd,
  canDelete
}
