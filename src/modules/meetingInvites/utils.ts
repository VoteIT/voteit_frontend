import { ComposerTranslation } from 'vue-i18n'
import type { AccountMeeting } from '../auth/types'
import { MeetingInvite, UsedByAccount } from './types'

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
    case 'member_id':
      return {
        hint: t('invites.member_id.hint'),
        label: t('invites.member_id.label'),
        typeLabel: t('invites.member_id.typeLabel')
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

export interface AccountInvites {
  account: UsedByAccount
  invites: MeetingInvite[]
}

/**
 * Group invites used by other accounts per account, split into the ones the
 * user can switch to and the rest.
 */
export function groupUsedInvites(invites: readonly MeetingInvite[]): {
  switchable: AccountInvites[]
  others: AccountInvites[]
} {
  const groups = new Map<number, AccountInvites>()
  for (const invite of invites) {
    const account = invite.used_by_account
    if (!account) continue
    const group = groups.get(account.pk)
    if (group) group.invites.push(invite)
    else groups.set(account.pk, { account, invites: [invite] })
  }
  const all = [...groups.values()]
  return {
    switchable: all.filter((g) => g.invites[0].switch_to),
    others: all.filter((g) => !g.invites[0].switch_to)
  }
}

/**
 * The meetings the user's invites were used for, then the account's other
 * meetings, each once.
 */
export function mergeAccountMeetings({
  account,
  invites
}: AccountInvites): AccountMeeting[] {
  const listed = new Map(account.meetings?.map((m) => [m.pk, m]))
  const invited = invites.map((inv) => ({
    pk: inv.meeting,
    title: inv.meeting_title,
    state: listed.get(inv.meeting)?.state
  }))
  const invitedPks = new Set(invited.map((m) => m.pk))
  return [
    ...invited,
    ...(account.meetings ?? []).filter((m) => !invitedPks.has(m.pk))
  ]
}
