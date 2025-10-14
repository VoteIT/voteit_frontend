import { ComposerTranslation } from 'vue-i18n'
import { MeetingInvite } from './types'

export function translateInviteType(
  type: keyof MeetingInvite['user_data'] | undefined,
  t: ComposerTranslation
): { hint?: string; label: string; typeLabel?: string } {
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
