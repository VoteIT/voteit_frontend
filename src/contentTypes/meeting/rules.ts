import useAuthentication from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'
import { Meeting, MeetingRole, predicate } from '../types'

import useWorkflows from '../useWorkflows'
import workflowStates, { MeetingState } from './workflowStates'

const { hasRole } = useContextRoles('meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(workflowStates)
const { user } = useAuthentication()

const FINISHED_STATES = [MeetingState.Closed, MeetingState.Archiving, MeetingState.Archived]
const ACTIVE_STATES = [MeetingState.Upcoming, MeetingState.Ongoing]

function isParticipant (meeting?: Meeting) {
  return meeting && hasRole(meeting.pk, MeetingRole.Participant)
}

function isProposer (meeting?: Meeting) {
  return meeting && hasRole(meeting.pk, MeetingRole.Proposer)
}

function isDiscusser (meeting?: Meeting) {
  return meeting && hasRole(meeting.pk, MeetingRole.Discusser)
}

function isPotentialVoter (meeting?: Meeting) {
  return meeting && hasRole(meeting.pk, MeetingRole.PotentialVoter)
}

const isModerator: predicate = (meeting?: Meeting) => {
  return !!meeting && hasRole(meeting.pk, MeetingRole.Moderator)
}

const isActive: predicate = (meeting?: Meeting) => {
  return !!meeting && ACTIVE_STATES.includes(meeting.state as MeetingState)
}

function isArchived (meeting?: Meeting) {
  const state = meeting && getState(meeting.state)
  return typeof state !== 'object' || state.isFinal
}

function isFinished (meeting?: Meeting) {
  return meeting && FINISHED_STATES.includes(meeting.state as MeetingState)
}

function canView (meeting?: Meeting) {
  return isParticipant(meeting)
}

function canAdd () {
  // TODO organization meeting creator role
  if (user.value) {
    return user.value.is_superuser
  }
  return false
}

function canChange (meeting?: Meeting) {
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
