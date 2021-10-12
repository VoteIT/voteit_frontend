import { user } from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'

import { Meeting, Predicate } from '../types'
import workflowStates, { MeetingState } from './workflowStates'

import useWorkflows from '../useWorkflows'
import organizationRules from '../organization/rules'
import { MeetingRole } from '@/modules/meetings/types'

const { hasRole } = useContextRoles('meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(workflowStates)

const FINISHED_STATES = [MeetingState.Closed, MeetingState.Archiving, MeetingState.Archived]
const ACTIVE_STATES = [MeetingState.Upcoming, MeetingState.Ongoing]

const isParticipant: Predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Participant)
}

const isProposer: Predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Proposer)
}

const isDiscusser: Predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Discusser)
}

const isPotentialVoter: Predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.PotentialVoter)
}

function isModerator (meeting?: Meeting): boolean {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Moderator)
}

function isActive (meeting?: Meeting): boolean {
  return !!meeting && ACTIVE_STATES.includes(meeting.state as MeetingState)
}

const isArchived: Predicate = (meeting?: Meeting) => {
  return !!meeting && !!getState(meeting.state)?.isFinal
}

const isFinished: Predicate = (meeting?: Meeting) => {
  return !!meeting && FINISHED_STATES.includes(meeting.state as MeetingState)
}

const canView: Predicate = (meeting?: Meeting) => {
  return isParticipant(meeting)
}

// Special rule case: Check organisation by pk. We won't always have organization data.
const canAdd: Predicate = (org?: number) => {
  return organizationRules.isMeetingCreator(org)
}

const canChange: Predicate = (meeting?: Meeting) => {
  return !isArchived(meeting) && isModerator(meeting)
}

const canChangeRoles: Predicate = (meeting: Meeting) => {
  return !isArchived(meeting) && (isModerator(meeting) || organizationRules.isManager(user.value?.organisation))
}

const canBecomeModerator: Predicate = (meeting: Meeting) => {
  return organizationRules.isManager(user.value?.organisation)
}

export default {
  isParticipant,
  isModerator,
  isActive,
  isArchived,
  isFinished,
  isProposer,
  isDiscusser,
  isPotentialVoter,
  canView,
  canAdd,
  canBecomeModerator,
  canChange,
  canChangeRoles,
  canDelete: canChange
}
