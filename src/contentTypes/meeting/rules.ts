import useAuthentication from '@/composables/useAuthentication'
import useContextRoles from '@/composables/useContextRoles'
import { Meeting, MeetingRole } from '../types'

import useWorkflows from '../useWorkflows'
import workflowStates from './workflowStates'

const { hasRole } = useContextRoles('Meeting')
// Import this a bit differently, to avoid cirkular imports
const { getState } = useWorkflows(workflowStates)
const { user } = useAuthentication()

const FINISHED_STATES = ['closed', 'archiving', 'archived']

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

function isModerator (meeting?: Meeting) {
  return meeting && hasRole(meeting.pk, MeetingRole.Moderator)
}

function isArchived (meeting?: Meeting) {
  const state = meeting && getState(meeting.state)
  return typeof state !== 'object' || state.isFinal
}

function isFinished (meeting?: Meeting) {
  return meeting && FINISHED_STATES.includes(meeting.state)
}

function canView (meeting?: Meeting) {
  return isParticipant(meeting)
}

function canAdd () {
  // TODO organization meeting creator role
  return user.value.is_superuser
}

function canChange (meeting?: Meeting) {
  return !isArchived(meeting) && isModerator(meeting)
}

export default {
  isParticipant,
  isModerator,
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
