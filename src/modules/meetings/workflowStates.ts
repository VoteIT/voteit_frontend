import { WorkflowState } from '@/contentTypes/types'
import { ThemeColor } from '@/utils/types'
import {
  MeetingComponentState,
  MeetingInviteState,
  MeetingState
} from './types'

export const meetingStates: WorkflowState<MeetingState>[] = [
  {
    transition: 'upcoming',
    icon: 'mdi-progress-clock',
    state: MeetingState.Upcoming,
    getName(t, count = 1) {
      return t('meeting.workflow.upcoming', count)
    }
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play-circle',
    state: MeetingState.Ongoing,
    getName(t, count = 1) {
      return t('meeting.workflow.ongoing', count)
    }
  },
  {
    transition: 'close',
    icon: 'mdi-close-circle-outline',
    state: MeetingState.Closed,
    getName(t, count = 1) {
      return t('meeting.workflow.closed', count)
    }
  },
  {
    transition: 'request_archiving',
    icon: 'mdi-archive',
    state: MeetingState.Archiving,
    getName(t, count = 1) {
      return t('meeting.workflow.archiving', count)
    }
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: MeetingState.Archived,
    isFinal: true,
    getName(t, count = 1) {
      return t('meeting.workflow.archived', count)
    }
  },
  {
    transition: 'request_delete',
    icon: 'mdi-delete',
    state: MeetingState.Deleting,
    getName(t, count = 1) {
      return t('meeting.workflow.deleting', count)
    }
  },
  {
    transition: 'abort_delete',
    icon: 'mdi-undo',
    state: MeetingState.Deleting, // FIXME Why this here?
    color: ThemeColor.Warning, // FIXME not displayed
    getName(t, count = 1) {
      return t('meeting.workflow.deleting', count)
    }
  }
]

export const meetingInviteStates: WorkflowState<MeetingInviteState>[] = [
  {
    icon: 'mdi-todo', // TODO
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

export const meetingComponentStates: WorkflowState<MeetingComponentState>[] = [
  {
    icon: 'mdi-todo', // TODO
    state: MeetingComponentState.Off,
    transition: 'disable',
    getName(t) {
      return t('meeting.componentState.off')
    }
  },
  {
    icon: 'mdi-todo', // TODO
    state: MeetingComponentState.On,
    transition: 'enable',
    getName(t) {
      return t('meeting.componentState.on')
    }
  }
]
