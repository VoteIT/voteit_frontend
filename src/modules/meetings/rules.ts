import { user } from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'

import { Meeting, MeetingRole, MeetingState } from '@/modules/meetings/types'
import useWorkflows from '@/contentTypes/useWorkflows'
import { meetingStates } from './workflowStates'
import { isMeetingCreator, isOrganisationManager } from '../organisations/rules'

const { hasRole } = useContextRoles('meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(meetingStates)

const FINISHED_STATES = [MeetingState.Closed, MeetingState.Archiving, MeetingState.Archived]
const ACTIVE_STATES = [MeetingState.Upcoming, MeetingState.Ongoing]

export function isParticipant (meeting?: Meeting): boolean | undefined {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Participant)
}

export function isProposer (meeting?: Meeting): boolean | undefined {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Proposer)
}

export function isDiscusser (meeting?: Meeting): boolean | undefined {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Discusser)
}

export function isPotentialVoter (meeting?: Meeting): boolean | undefined {
  return !!meeting && hasRole(meeting.pk, MeetingRole.PotentialVoter)
}

export function isModerator (meeting?: Meeting): boolean | undefined {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Moderator)
}

export function isActiveMeeting (meeting?: Meeting): boolean {
  return !!meeting && ACTIVE_STATES.includes(meeting.state as MeetingState)
}

export function isArchivedMeeting (meeting?: Meeting): boolean {
  return !!meeting && !!getState(meeting.state)?.isFinal
}

export function isFinishedMeeting (meeting?: Meeting): boolean {
  return !!meeting && FINISHED_STATES.includes(meeting.state as MeetingState)
}

export function canViewMeeting (meeting?: Meeting): boolean {
  return !!isParticipant(meeting)
}

// Special rule case: Check organisation by pk. We won't always have organization data.
export function canAddMeeting (org?: number): boolean {
  return isMeetingCreator(org)
}

export function canChangeMeeting (meeting?: Meeting): boolean {
  return !isArchivedMeeting(meeting) && !!isModerator(meeting)
}

export function canChangeRolesMeeting (meeting: Meeting): boolean {
  return !isArchivedMeeting(meeting) && (isModerator(meeting) || isOrganisationManager(user.value?.organisation))
}

export function canBecomeModeratorMeeting (meeting: Meeting): boolean {
  return isOrganisationManager(user.value?.organisation)
}

export function canViewMeetingInvite (meeting: Meeting): boolean {
  return !!isModerator(meeting)
}

export function canAddMeetingInvite (meeting: Meeting): boolean {
  return !!isModerator(meeting) && !isArchivedMeeting(meeting)
}
