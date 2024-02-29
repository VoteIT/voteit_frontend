import { reactive } from 'vue'
import useAuthentication, { user } from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'

import {
  Meeting,
  MeetingInvite,
  MeetingInviteState,
  MeetingRole,
  MeetingState
} from '@/modules/meetings/types'
import useWorkflows from '@/contentTypes/useWorkflows'
import { meetingStates } from './workflowStates'
import { isOrganisationManager } from '../organisations/rules'
import { meetings } from './useMeetings'

const { hasRole } = useContextRoles('meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(meetingStates)

const FINISHED_STATES = [
  MeetingState.Closed,
  MeetingState.Archiving,
  MeetingState.Archived
]
const ACTIVE_STATES = [MeetingState.Upcoming, MeetingState.Ongoing]

type MeetingT = Meeting | number | undefined

const { isAuthenticated } = useAuthentication()

const fakeRoles = reactive(new Map<number, MeetingRole[]>())

export function hasMeetingRole(
  meeting: MeetingT,
  role: MeetingRole,
  actualRole = false
): boolean | undefined {
  // isAuthenticated false means user is definitely not authenticated.
  if (isAuthenticated.value === false) return false
  if (!meeting) return
  if (typeof meeting !== 'number') meeting = meeting.pk
  // Meeting can have fake roles for testing purposes (only set by moderators)
  const meetingFakeRoles = fakeRoles.get(meeting)
  if (actualRole || !meetingFakeRoles) return hasRole(meeting, role)
  return meetingFakeRoles.includes(role)
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
  if (typeof meeting === 'number') meeting = meetings.get(meeting)
  return !!meeting && ACTIVE_STATES.includes(meeting.state)
}

export function isArchivedMeeting(meeting: MeetingT): boolean {
  if (typeof meeting === 'number') meeting = meetings.get(meeting)
  return !!meeting && !!getState(meeting.state)?.isFinal
}

export function isFinishedMeeting(meeting: MeetingT): boolean {
  if (typeof meeting === 'number') meeting = meetings.get(meeting)
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
    (isModerator(meeting) || isOrganisationManager(user.value?.organisation))
  )
}

export function canBecomeModerator(): boolean {
  return isOrganisationManager(user.value?.organisation)
}

export function canViewMeetingInvite(meeting: Meeting): boolean {
  return !!isModerator(meeting)
}

export function canAddMeetingInvite(meeting: Meeting): boolean {
  return !!isModerator(meeting) && !isArchivedMeeting(meeting)
}

export function canDeleteMeetingInvite(invite: MeetingInvite): boolean {
  const meeting = meetings.get(invite.meeting)
  if (!meeting) return false
  return canAddMeetingInvite(meeting)
}
