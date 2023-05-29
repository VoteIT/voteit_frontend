import { BaseContent } from '@/contentTypes/types'

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

export interface VoteResult {
  approved: number[]
  denied: number[]
  vote_count: number
}

export interface Poll extends BaseContent {
  abstain_count?: number // Only finished polls
  agenda_item: number
  body: string | null
  closed: string | null
  electoral_register?: number
  initial_electoral_register?: number
  meeting: number
  method_name: string
  proposals: number[]
  proposal_ordering: 'alphabetical' | 'chronological' | 'random' // Early guesstimation of backend values
  result: VoteResult
  settings: unknown
  state: PollState
  started: string | null
}
