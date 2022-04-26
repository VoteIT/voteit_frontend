import { user } from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'
import { isActiveMeeting, isModerator } from '../meetings/rules'
import { Meeting, MeetingRole } from '../meetings/types'

import { meetings } from '../meetings/useMeetings'

import { SpeakerList, SpeakerListState, SpeakerSystem, SpeakerSystemRole, SpeakerSystemState } from './types'
import { currentlySpeaking, speakerLists, speakerSystems } from './useSpeakerLists'

const { hasRole } = useContextRoles<SpeakerSystemRole>('speaker_system')
const meetingRoles = useContextRoles<MeetingRole>('meeting')

/* Speaker Systems */

function getSystem (list: SpeakerList) {
  return speakerSystems.get(list.speaker_system)
}

function getActiveList (system: SpeakerSystem) {
  return system.active_list && speakerLists.get(system.active_list)
}

function isActiveSystem (system: SpeakerSystem): boolean {
  return system.state === SpeakerSystemState.Active
}

function isArchivedSystem (system: SpeakerSystem): boolean {
  return system.state === SpeakerSystemState.Archived
}

export function isSystemModerator (system: SpeakerSystem): boolean | undefined {
  const meeting = meetings.get(system.meeting)
  return isModerator(meeting) || hasRole(system.pk, SpeakerSystemRole.ListModerator)
}

export function isSystemSpeaker (system: SpeakerSystem, user?: number): boolean | undefined {
  return meetingRoles.hasRole(system.meeting, system.meeting_roles_to_speaker, user) || hasRole(system.pk, SpeakerSystemRole.Speaker, user)
}

function hasActiveSpeaker (system: SpeakerSystem) {
  const active = getActiveList(system)
  return !!(active && currentlySpeaking.get(active.pk))
}

export function canAddSpeakerSystem (meeting: Meeting): boolean {
  return !!isModerator(meeting) && isActiveMeeting(meeting)
}

export function canChangeSpeakerSystem (system: SpeakerSystem): boolean {
  const meeting = meetings.get(system.meeting)
  return !!isModerator(meeting) && isActiveMeeting(meeting) && !isArchivedSystem(system)
}

export function canDeleteSpeakerSystem (system: SpeakerSystem): boolean {
  const meeting = meetings.get(system.meeting)
  return !!isModerator(meeting) && isActiveMeeting(meeting) && !isArchivedSystem(system)
}

/* Speaker Lists */

function isActiveList (list: SpeakerList): boolean {
  const system = getSystem(list)
  // eslint-disable-next-line camelcase
  return system?.active_list === list.pk
}

function isOpenList (list: SpeakerList): boolean {
  return list.state === SpeakerListState.Open
}

function isCurrentlySpeaking (list: SpeakerList): boolean {
  return currentlySpeaking.get(list.pk) === user.value?.pk
}

export function canAddSpeakerList (system: SpeakerSystem): boolean {
  return !!isSystemModerator(system) && isActiveSystem(system)
}

export function canChangeSpeakerList (list: SpeakerList): boolean {
  const system = getSystem(list)
  return !!system && canAddSpeakerList(system)
}
export const canDeleteSpeakerList = canChangeSpeakerList

export function canActivateList (list: SpeakerList): boolean {
  const system = speakerSystems.get(list.speaker_system)
  return !!system && canAddSpeakerList(system) && system.active_list !== list.pk && !hasActiveSpeaker(system)
}

export function canStartSpeaker (list: SpeakerList): boolean {
  const system = getSystem(list)
  return !!system && isActiveList(list) && !!isSystemModerator(system) && isActiveSystem(system)
}

export function canStopSpeaker (list: SpeakerList): boolean {
  const system = getSystem(list)
  return !!system && isActiveList(list) && !!isSystemModerator(system)
}

export function canEnterList (list: SpeakerList): boolean {
  const system = getSystem(list)
  return !!system && (
    (!!isSystemSpeaker(system) && isOpenList(list) && isActiveSystem(system)) ||
    (!!isSystemModerator(system) && !isArchivedSystem(system))
  )
}

export function canLeaveList (list: SpeakerList): boolean {
  const system = getSystem(list)
  return !!system && (!!isSystemModerator(system) || !!isSystemSpeaker(system)) && !isCurrentlySpeaking(list)
}
