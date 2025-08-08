import { user } from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'
import { isActiveMeeting, isModerator } from '../meetings/rules'
import { Meeting, MeetingRole } from '../meetings/types'

import {
  SpeakerList,
  SpeakerListState,
  SpeakerSystem,
  SpeakerSystemRole,
  SpeakerSystemState
} from './types'
import {
  getCurrent,
  getRoomSpeakerSystem,
  speakerLists
} from './useSpeakerLists'

const { hasRole } = useContextRoles<SpeakerSystemRole>('speaker_system')
const meetingRoles = useContextRoles<MeetingRole>('meeting')

/* Speaker Systems */

function getActiveList(system: SpeakerSystem) {
  return system.active_list && speakerLists.get(system.active_list)
}

function isActiveSystem(system: SpeakerSystem): boolean {
  return (
    system.state === SpeakerSystemState.Active &&
    isActiveMeeting(system.meeting)
  )
}

function isArchivedSystem(system: SpeakerSystem): boolean {
  return system.state === SpeakerSystemState.Archived
}

export function isSystemModerator(system: SpeakerSystem): boolean | undefined {
  return (
    isModerator(system.meeting) ||
    hasRole(system.pk, SpeakerSystemRole.ListModerator)
  )
}

export function isSystemSpeaker(
  system: SpeakerSystem,
  user?: number
): boolean | undefined {
  return (
    meetingRoles.hasRole(
      system.meeting,
      system.meeting_roles_to_speaker,
      user
    ) || hasRole(system.pk, SpeakerSystemRole.Speaker, user)
  )
}

export function hasActiveSpeaker(system: SpeakerSystem) {
  const active = getActiveList(system)
  return !!(active && getCurrent(active.pk))
}

export function canAddSpeakerSystem(meeting: Meeting): boolean {
  return !!isModerator(meeting) && isActiveMeeting(meeting)
}

export function canChangeSpeakerSystem(system: SpeakerSystem): boolean {
  return (
    !!isModerator(system.meeting) &&
    isActiveMeeting(system.meeting) &&
    !isArchivedSystem(system)
  )
}

export function canDeleteSpeakerSystem(system: SpeakerSystem): boolean {
  return (
    !!isModerator(system.meeting) &&
    isActiveMeeting(system.meeting) &&
    !isArchivedSystem(system)
  )
}

/* Speaker Lists */

function isActiveList(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  return system?.active_list === list.pk
}

export function isOpenList(list: SpeakerList): boolean {
  return list.state === SpeakerListState.Open
}

function isCurrentlySpeaking(list: SpeakerList): boolean {
  return getCurrent(list.pk) === user.value?.pk
}

export function canChangeSpeakerList(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  return !!system && canManageSystem(system)
}
export const canDeleteSpeakerList = canChangeSpeakerList

export function canActivateList(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  return (
    !!system &&
    canManageSystem(system) &&
    system.active_list !== list.pk &&
    !hasActiveSpeaker(system)
  )
}

export function canManageSystem(system: SpeakerSystem): boolean {
  return !!isSystemModerator(system) && !isArchivedSystem(system)
}

export function canStartSpeaker(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  return (
    !!system &&
    isActiveList(list) &&
    !!isSystemModerator(system) &&
    isActiveSystem(system)
  )
}

export function canStopSpeaker(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  return !!system && isActiveList(list) && !!isSystemModerator(system)
}

export function canEnterList(list: SpeakerList): boolean {
  const system = getRoomSpeakerSystem(list.room)
  if (!system) return false
  return isActiveSystem(system) && isOpenList(list) && !!isSystemSpeaker(system)
}

export function canLeaveList(list: SpeakerList): boolean {
  return !isCurrentlySpeaking(list)
}
