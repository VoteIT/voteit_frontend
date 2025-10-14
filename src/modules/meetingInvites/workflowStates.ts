import { WorkflowStates } from '@/contentTypes/types'
import { MeetingInviteState } from './types'

export const meetingInviteStates: WorkflowStates<
  MeetingInviteState,
  'accept' | 'reject' | 'revoke'
> = [
  {
    icon: 'mdi-email-open',
    state: MeetingInviteState.Open,
    getName(t, count = 1) {
      return t('invites.workflow.open', count)
    }
  },
  {
    transition: 'accept',
    icon: 'mdi-check',
    state: MeetingInviteState.Accepted,
    isFinal: true,
    getName(t, count = 1) {
      return t('invites.workflow.accepted', count)
    }
  },
  {
    transition: 'reject',
    icon: 'mdi-cancel',
    state: MeetingInviteState.Rejected,
    isFinal: true,
    getName(t, count = 1) {
      return t('invites.workflow.rejected', count)
    }
  },
  {
    transition: 'revoke',
    icon: 'mdi-undo',
    state: MeetingInviteState.Revoked,
    isFinal: true,
    getName(t, count = 1) {
      return t('invites.workflow.revoked', count)
    }
  },
  {
    icon: 'mdi-clock-alert',
    state: MeetingInviteState.Expired,
    isFinal: true,
    getName(t, count = 1) {
      return t('invites.workflow.expired', count)
    }
  }
]
