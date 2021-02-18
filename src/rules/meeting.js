import useAuthentication from '../composables/useAuthentication'
import useContextRoles from '../composables/useContextRoles'
import useWorkflows from '../workflows/useWorkflows'

const { hasRole } = useContextRoles('Meeting')
const { getState } = useWorkflows('Meeting')
const { user } = useAuthentication()

const FINISHED_STATES = ['closed', 'archiving', 'archived']

function isParticipant (meeting) {
  return meeting && hasRole(meeting.pk, 'participant')
}

function isProposer (meeting) {
  return meeting && hasRole(meeting.pk, 'proposer')
}

function isDiscusser (meeting) {
  return meeting && hasRole(meeting.pk, 'discusser')
}

function isPotentialVoter (meeting) {
  return meeting && hasRole(meeting.pk, 'potential_voter')
}

function isModerator (meeting) {
  return meeting && hasRole(meeting.pk, 'moderator')
}

function isArchived (meeting) {
  return !meeting.state || !getState(meeting.state).isFinal
}

function isFinished (meeting) {
  return FINISHED_STATES.includes(meeting.state)
}

function canAdd () {
  return user.value.is_superuser
}

function canChange (meeting) {
  return isModerator(meeting)
}

function canDelete (meeting) {
  return isModerator(meeting) && !isArchived(meeting)
}

export default {
  isParticipant,
  isModerator,
  isArchived,
  isFinished,
  isProposer,
  isDiscusser,
  isPotentialVoter,
  canAdd,
  canChange,
  canDelete
}
