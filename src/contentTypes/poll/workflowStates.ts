import { MeetingRole } from '../types'

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
    icon: 'visibility_off',
    state: PollState.Private,
    name: 'Private',
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'pause',
    state: PollState.Upcoming,
    name: 'Upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'how_to_vote',
    state: PollState.Ongoing,
    name: 'Ongoing'
  },
  {
    transition: 'close',
    icon: 'gavel',
    state: PollState.Closed,
    name: 'Closed'
  },
  {
    transition: 'finish',
    icon: 'check',
    state: PollState.Finished,
    name: 'Finished',
    isFinal: true
  },
  {
    transition: 'cancel',
    icon: 'block',
    state: PollState.Canceled,
    name: 'Canceled',
    isFinal: true
  },
  {
    icon: 'report',
    state: PollState.Failed,
    name: 'Failed',
    isFinal: true
  }
]
