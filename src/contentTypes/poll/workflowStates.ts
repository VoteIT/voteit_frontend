import { MeetingRole, WorkflowState } from '../types'

export enum PollState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Finished = 'finished',
  Canceled = 'canceled',
  Failed = 'failed'
}

const states: WorkflowState[] = [
  {
    transition: 'unpublish',
    icon: 'mdi-eye-off',
    state: PollState.Private,
    name: 'Private',
    requiresRole: MeetingRole.Moderator,
    priority: 4
  },
  {
    transition: 'upcoming',
    icon: 'mdi-pause',
    state: PollState.Upcoming,
    name: 'Upcoming',
    priority: 2
  },
  {
    transition: 'ongoing',
    icon: 'mdi-vote',
    state: PollState.Ongoing,
    name: 'Ongoing',
    priority: 1
  },
  {
    transition: 'close',
    icon: 'mdi-gavel',
    state: PollState.Closed,
    name: 'Closed'
  },
  {
    transition: 'finish',
    icon: 'mdi-check',
    state: PollState.Finished,
    name: 'Finished',
    isFinal: true,
    priority: 3
  },
  {
    transition: 'cancel',
    icon: 'mdi-cancel',
    state: PollState.Canceled,
    name: 'Canceled',
    isFinal: true
  },
  {
    icon: 'mdi-alert',
    state: PollState.Failed,
    name: 'Failed',
    isFinal: true
  }
]

export default states
