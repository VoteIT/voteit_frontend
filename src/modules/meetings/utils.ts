import { ComposerTranslation } from 'vue-i18n'
import { MeetingInvite, MeetingRole } from './types'

/**
 * Translation method to avoid dynamic translation strings
 */
export function translateMeetingRole (role: MeetingRole, t: ComposerTranslation): string {
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

export function translateInviteType (type: keyof MeetingInvite['user_data'] | undefined, t: ComposerTranslation): { hint?: string, label: string, typeLabel?: string } {
  if (!type) return { label: t('invites.mixed.label') }
  switch (type) {
    case 'email':
      return {
        hint: t('invites.email.hint'),
        label: t('invites.email.label'),
        typeLabel: t('invites.email.typeLabel')
      }
    case 'swedish_ssn':
      return {
        hint: t('invites.swedish_ssn.hint'),
        label: t('invites.swedish_ssn.label'),
        typeLabel: t('invites.swedish_ssn.typeLabel')
      }
  }
  throw new Error(`Unknown invitation type ${type}`)
}
