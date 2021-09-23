import { MeetingRole } from '@/modules/meetings/types'
import { WorkflowState } from '../types'

export enum PollState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Finished = 'finished',
  Canceled = 'canceled',
  Failed = 'failed'
}

export default [
  {
    transition: 'unpublish',
    icon: 'mdi-eye-off',
    state: PollState.Private,
    requiresRole: MeetingRole.Moderator,
    priority: 4
  },
  {
    transition: 'upcoming',
    icon: 'mdi-progress-clock',
    state: PollState.Upcoming,
    priority: 2
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play-circle',
    state: PollState.Ongoing,
    priority: 1
  },
  {
    transition: 'close',
    icon: 'mdi-gavel',
    state: PollState.Closed
  },
  {
    transition: 'finish',
    icon: 'mdi-check',
    state: PollState.Finished,
    isFinal: true,
    priority: 3
  },
  {
    transition: 'cancel',
    icon: 'mdi-cancel',
    state: PollState.Canceled,
    isFinal: true
  },
  {
    icon: 'mdi-alert',
    state: PollState.Failed,
    isFinal: true
  }
] as WorkflowState[]
