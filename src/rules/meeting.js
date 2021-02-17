import useAuthentication from '../composables/useAuthentication'
import useContextRoles from '../composables/useContextRoles'
import useWorkflows from '../workflows/useWorkflows'

const meetingRoles = useContextRoles('Meeting')
const { getState } = useWorkflows('Meeting')
const { user } = useAuthentication()

function isParticipant (meeting) {
  return meetingRoles.hasRole(meeting.pk, 'participant')
}

/*
function isProposer (meeting) {
  return meetingRoles.hasRole(meeting.pk, 'proposer')
}

function isDiscusser (meeting) {
  return meetingRoles.hasRole(meeting.pk, 'discusser')
}

function isPotentialVoter (meeting) {
  return meetingRoles.hasRole(meeting.pk, 'potential_voter')
}
*/

function isModerator (meeting) {
  return meetingRoles.hasRole(meeting.pk, 'moderator')
}

function isNotArchived (meeting) {
  return !getState(meeting.state).isFinal
}

function canAdd () {
  return user.value.is_superuser
}

function canChange (meeting) {
  return isModerator(meeting)
}

function canDelete (meeting) {
  return isModerator(meeting) && isNotArchived(meeting)
}

export default {
  isParticipant,
  canAdd,
  canChange,
  canDelete
}
