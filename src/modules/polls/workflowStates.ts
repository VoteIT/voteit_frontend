import { MeetingRole } from '@/modules/meetings/types'
import { PollState, PollTransition } from './types'
import { WorkflowState } from '@/contentTypes/types'

export const pollStates: WorkflowState[] = [
  {
    transition: PollTransition.Unpublish,
    icon: 'mdi-eye-off',
    state: PollState.Private,
    requiresRole: MeetingRole.Moderator,
    priority: 4
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
    state: PollState.Closed
  },
  {
    transition: PollTransition.Finish,
    icon: 'mdi-check',
    state: PollState.Finished,
    isFinal: true,
    priority: 3
  },
  {
    transition: PollTransition.Cancel,
    icon: 'mdi-cancel',
    state: PollState.Canceled,
    isFinal: true
  },
  {
    icon: 'mdi-alert',
    state: PollState.Failed,
    isFinal: true
  }
]
