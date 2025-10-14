import { WorkflowStates } from '@/contentTypes/types'
import { ThemeColor } from '@/utils/types'
import { MeetingComponentState, MeetingState } from './types'

export const meetingStates: WorkflowStates<
  MeetingState,
  | 'upcoming'
  | 'ongoing'
  | 'close'
  | 'request_archiving'
  | 'archive'
  | 'request_delete'
  | 'abort_delete'
> = [
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
    color: ThemeColor.Warning,
    getName(t, count = 1) {
      return t('meeting.workflow.deleting', count)
    }
  },
  {
    transition: 'abort_delete',
    icon: 'mdi-undo',
    state: MeetingState.Previous, // FIXME Workaround - state and transition shouldn't be 1-to-1
    getName(t, count = 1) {
      return t('meeting.workflow.deleting', count)
    }
  }
]

export const meetingComponentStates: WorkflowStates<
  MeetingComponentState,
  'disable' | 'enable'
> = [
  {
    icon: 'mdi-close',
    state: MeetingComponentState.Off,
    transition: 'disable',
    getName(t) {
      return t('meeting.componentState.off')
    }
  },
  {
    icon: 'mdi-check',
    state: MeetingComponentState.On,
    transition: 'enable',
    getName(t) {
      return t('meeting.componentState.on')
    }
  }
]
