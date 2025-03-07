import { MeetingRole } from '@/modules/meetings/types'
import { PollState, PollTransition } from './types'
import { WorkflowStates } from '@/contentTypes/types'

export const pollStates: WorkflowStates<PollState, PollTransition> = [
  {
    transition: PollTransition.Unpublish,
    icon: 'mdi-eye-off',
    state: PollState.Private,
    requiresRole: MeetingRole.Moderator,
    priority: 6,
    getName(t, count = 1) {
      return t('poll.workflow.private', count)
    }
  },
  {
    transition: PollTransition.Upcoming,
    icon: 'mdi-progress-clock',
    state: PollState.Upcoming,
    priority: 2,
    getName(t, count = 1) {
      return t('poll.workflow.upcoming', count)
    }
  },
  {
    transition: PollTransition.Ongoing,
    icon: 'mdi-play-circle',
    state: PollState.Ongoing,
    priority: 1,
    getName(t, count = 1) {
      return t('poll.workflow.ongoing', count)
    }
  },
  {
    transition: PollTransition.Close,
    icon: 'mdi-gavel',
    state: PollState.Closed,
    requiresRole: MeetingRole.Moderator,
    priority: 3,
    getName(t, count = 1) {
      return t('poll.workflow.closed', count)
    }
  },
  {
    transition: PollTransition.Finish,
    icon: 'mdi-check',
    state: PollState.Finished,
    priority: 4,
    getName(t, count = 1) {
      return t('poll.workflow.finished', count)
    }
  },
  {
    transition: PollTransition.Cancel,
    icon: 'mdi-cancel',
    state: PollState.Canceled,
    priority: 7,
    getName(t, count = 1) {
      return t('poll.workflow.canceled', count)
    }
  },
  {
    icon: 'mdi-alert',
    state: PollState.Failed,
    isFinal: true,
    priority: 8,
    getName(t, count = 1) {
      return t('poll.workflow.failed', count)
    }
  },
  {
    icon: 'mdi-cancel',
    isFinal: true,
    state: PollState.NoResult,
    priority: 9,
    getName(t, count = 1) {
      return t('poll.workflow.no_result', count)
    }
  },
  {
    icon: 'mdi-eye-off',
    state: PollState.Withheld,
    transition: PollTransition.WithholdResult,
    priority: 5,
    getName(t, count = 1) {
      return t('poll.workflow.withheld', count)
    }
  }
]
