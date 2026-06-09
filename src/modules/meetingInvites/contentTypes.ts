import ContentType from '@/contentTypes/ContentType'
import { MeetingInvite, MeetingInviteState } from './types'

export const matchedInviteType = new ContentType<MeetingInvite>({
  name: 'meeting_invite',
  restEndpoint: 'handle-matched-invites/'
})

export const meetingInviteType = new ContentType<
  MeetingInvite,
  'accept' | 'expire' | 'reject' | 'revoke'
>({
  name: 'meeting_invite',
  restEndpoint: 'meeting-invites/',
  states: {
    name: 'InviteStateMachine',
    meta: {
      [MeetingInviteState.Open]: {
        icon: 'mdi-email-open',
        translate: (t, count = 1) => t('invites.workflow.open', count)
      },
      [MeetingInviteState.Accepted]: {
        icon: 'mdi-check',
        translate: (t, count = 1) => t('invites.workflow.accepted', count)
      },
      [MeetingInviteState.Rejected]: {
        icon: 'mdi-cancel',
        translate: (t, count = 1) => t('invites.workflow.rejected', count)
      },
      [MeetingInviteState.Revoked]: {
        icon: 'mdi-undo',
        translate: (t, count = 1) => t('invites.workflow.revoked', count)
      },
      [MeetingInviteState.Expired]: {
        icon: 'mdi-clock-alert',
        translate: (t, count = 1) => t('invites.workflow.expired', count)
      }
    }
  }
})
