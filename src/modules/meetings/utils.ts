import { ComposerTranslation } from 'vue-i18n'
import { MeetingRole } from './types'

/**
 * Translation method to avoid dynamic translation strings
 */
export function translateMeetingRole(
  role: MeetingRole,
  t: ComposerTranslation
): string {
  switch (role) {
    case MeetingRole.Discusser:
      return t('role.discusser')
    case MeetingRole.Moderator:
      return t('role.moderator')
    case MeetingRole.Participant:
      return t('role.participant')
    case MeetingRole.PotentialVoter:
      return t('role.potential_voter')
    case MeetingRole.Proposer:
      return t('role.proposer')
  }
}
