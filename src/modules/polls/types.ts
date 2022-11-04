/* eslint-disable camelcase */
export enum PollState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Finished = 'finished',
  Canceled = 'canceled',
  Failed = 'failed',
  NoResult = 'no_result'
}

export enum PollIcon {
  Private = 'mdi-eye-off',
  Upcoming = 'mdi-progress-clock',
  Ongoing = 'mdi-play-circle',
  Closed = 'mdi-gavel',
  Finished = 'mdi-check',
  Canceled = 'mdi-cancel',
  Failed = 'mdi-alert',
  NoResult = 'mdi-cancel'
}

export enum PollTransition {
  Unpublish = 'unpublish',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Close = 'close',
  Finish = 'finish',
  Cancel = 'cancel'
}

export interface PollStatus {
  pk: number
  voted: number
  total: number
}
