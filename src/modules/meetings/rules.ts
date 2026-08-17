import { shallowReactive } from 'vue'

import useContextRoles from '@/composables/useContextRoles'

import useAuthStore from '../auth/useAuthStore'
import { Meeting, MeetingRole, MeetingState } from '../meetings/types'
import { MeetingInvite } from '../meetingInvites/types'
import { isOrganisationManager } from '../organisations/rules'

import useMeetingStore from './useMeetingStore'
import { meetingType } from './contentTypes'

const { hasRole } = useContextRoles<MeetingRole>('meeting')

const FINISHED_STATES = [
  MeetingState.Closed,
  MeetingState.Archiving,
  MeetingState.Archived
]
const ACTIVE_STATES = [MeetingState.Upcoming, MeetingState.Ongoing]

type MeetingT = Meeting | number | undefined

const fakeRoles = shallowReactive(new Map<number, MeetingRole[]>())

export function hasMeetingRole(
  meeting: MeetingT,
  role: MeetingRole,
  actualRole = false
): boolean | undefined {
  // isAnonymous means user is definitely not authenticated.
  if (useAuthStore().isAnonymous) return false
  if (!meeting) return
  if (typeof meeting !== 'number') meeting = meeting.pk
  // Meeting can have fake roles for testing purposes (only set by moderators)
  if (actualRole) return hasRole(meeting, role)
  const meetingFakeRoles = fakeRoles.get(meeting)
  return meetingFakeRoles
    ? meetingFakeRoles.includes(role)
    : hasRole(meeting, role)
}

export function hasFakeRoles(meeting: number) {
  return fakeRoles.has(meeting)
}

export function setFakeRoles(meeting: number, roles?: MeetingRole[]) {
  if (roles) fakeRoles.set(meeting, roles)
  else fakeRoles.delete(meeting)
}

export function isParticipant(meeting: MeetingT): boolean | undefined {
  return hasMeetingRole(meeting, MeetingRole.Participant)
}

export function isProposer(meeting: MeetingT): boolean | undefined {
  return hasMeetingRole(meeting, MeetingRole.Proposer)
}

export function isDiscusser(meeting: MeetingT): boolean | undefined {
  return hasMeetingRole(meeting, MeetingRole.Discusser)
}

export function isPotentialVoter(meeting: MeetingT): boolean | undefined {
  return hasMeetingRole(meeting, MeetingRole.PotentialVoter)
}

export function isModerator(meeting: MeetingT): boolean | undefined {
  return hasMeetingRole(meeting, MeetingRole.Moderator)
}

export function isActiveMeeting(meeting: MeetingT): boolean {
  if (typeof meeting === 'number')
    meeting = useMeetingStore().getMeeting(meeting)
  return !!meeting && ACTIVE_STATES.includes(meeting.state)
}

export function isArchivedMeeting(meeting: MeetingT): boolean {
  if (typeof meeting === 'number')
    meeting = useMeetingStore().getMeeting(meeting)
  return !!meeting && !!meetingType.sm.getState(meeting.state).final
}

export function isFinishedMeeting(meeting: MeetingT): boolean {
  if (typeof meeting === 'number')
    meeting = useMeetingStore().getMeeting(meeting)
  return !!meeting && FINISHED_STATES.includes(meeting.state)
}

export function canViewMeeting(meeting?: Meeting): boolean | undefined {
  return isParticipant(meeting)
}

export function canChangeMeeting(meeting?: Meeting): boolean {
  return !isArchivedMeeting(meeting) && !!isModerator(meeting)
}

export function canChangeRolesMeeting(meeting: Meeting): boolean {
  return (
    !isArchivedMeeting(meeting) &&
    (isModerator(meeting) ||
      isOrganisationManager(useAuthStore().user?.organisation))
  )
}

export function canBecomeModerator(): boolean {
  return isOrganisationManager(useAuthStore().user?.organisation)
}

export function canViewMeetingInvite(meeting: Meeting): boolean {
  return !!isModerator(meeting)
}

export function canAddMeetingInvite(meeting: Meeting): boolean {
  return !!isModerator(meeting) && !isArchivedMeeting(meeting)
}

export function canDeleteMeetingInvite(invite: MeetingInvite): boolean {
  const meeting = useMeetingStore().getMeeting(invite.meeting)
  if (!meeting) return false
  return canAddMeetingInvite(meeting)
}
