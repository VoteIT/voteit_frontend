import { ComposerTranslation } from 'vue-i18n'
import { Meeting, MeetingRole } from './types'
import { Dictionary } from 'lodash'
import { slugify } from '@/utils'

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

/**
 * Convenience fn to create a meeting route
 */
export function getMeetingRoute(
  meeting: Pick<Meeting, 'title' | 'pk'>,
  name: string = 'meeting',
  extraParams?: Dictionary<string | number>
) {
  return {
    name,
    params: {
      id: meeting.pk,
      slug: slugify(meeting.title),
      ...extraParams
    }
  }
}

export const roleIcons: Record<MeetingRole, string> = {
  [MeetingRole.Participant]: 'mdi-eye',
  [MeetingRole.Moderator]: 'mdi-gavel',
  [MeetingRole.Proposer]: 'mdi-note-plus',
  [MeetingRole.Discusser]: 'mdi-comment-outline',
  [MeetingRole.PotentialVoter]: 'mdi-star-outline'
}
export function getMeetingRoleIcon(role: MeetingRole) {
  return roleIcons[role]
}
