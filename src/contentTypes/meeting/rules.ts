import useAuthentication from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'

import { Meeting, MeetingRole, Organization, Predicate } from '../types'
import workflowStates, { MeetingState } from './workflowStates'

import useWorkflows from '../useWorkflows'
import organizationRules from '../organization/rules'

const { hasRole } = useContextRoles('meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(workflowStates)
const { user } = useAuthentication()

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

const isModerator: Predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Moderator)
}

const isActive: Predicate = (meeting?: Meeting) => {
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
  canChange,
  canDelete: canChange
}
