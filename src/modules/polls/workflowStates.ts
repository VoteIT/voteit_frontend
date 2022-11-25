import { MeetingRole } from '@/modules/meetings/types'
import { PollState, PollTransition } from './types'
import { WorkflowState } from '@/contentTypes/types'

export const pollStates: WorkflowState<PollState>[] = [
  {
    transition: PollTransition.Unpublish,
    icon: 'mdi-eye-off',
    state: PollState.Private,
    requiresRole: MeetingRole.Moderator,
    priority: 5
  },
  {
    transition: PollTransition.Upcoming,
    icon: 'mdi-progress-clock',
    state: PollState.Upcoming,
    priority: 2
  },
  {
    transition: PollTransition.Ongoing,
    icon: 'mdi-play-circle',
    state: PollState.Ongoing,
    priority: 1
  },
  {
    transition: PollTransition.Close,
    icon: 'mdi-gavel',
    state: PollState.Closed,
    requiresRole: MeetingRole.Moderator,
    priority: 3
  },
  {
    transition: PollTransition.Finish,
    icon: 'mdi-check',
    state: PollState.Finished,
    isFinal: true,
    priority: 4
  },
  {
    transition: PollTransition.Cancel,
    icon: 'mdi-cancel',
    state: PollState.Canceled,
    priority: 6
  },
  {
    icon: 'mdi-alert',
    state: PollState.Failed,
    isFinal: true,
    priority: 7
  },
  {
    icon: 'mdi-cancel',
    state: PollState.NoResult,
    isFinal: true,
    priority: 8
  }
]
