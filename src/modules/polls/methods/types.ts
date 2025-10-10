import { ComposerTranslation } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'
import { Poll, VoteResult } from '../types'

export enum PollCriteria {
  MajorityWinner = 'majorityWinner',
  MajorityLoser = 'majorityLoser',
  MutualMajority = 'mutualMajority',
  CondorcetWinner = 'condorcetWinner',
  CondorcetLoser = 'condorcetLoser',
  CloneProof = 'cloneProof',
  Proportional = 'proportional'
}

export const Conditional = Symbol('conditional')
export type PollMethodCriterion = Partial<
  Record<PollCriteria, boolean | typeof Conditional>
>

export interface RankedVote {
  ranking: number[]
}

export interface SchulzeVote {
  ranking: number[][]
}

export enum SimpleChoice {
  Abstain = 'abstain',
  Yes = 'yes',
  No = 'no'
}

export type MajorityVote = { choice: number }
export type SimpleVote = Record<SimpleChoice, number[]>

export interface ApprovalVote {
  choices: number[]
}

export interface SimpleChoiceDesc {
  value: SimpleChoice
  icon: string
  getTitle(t: ComposerTranslation): string
  color: ThemeColor
}

type SchulzePair = [[number, number], number]
export interface SchulzeResult extends VoteResult {
  winner: number
  candidates: number[]
  tied_winners: number[] | null
  pairs: SchulzePair[]
  strong_pairs: SchulzePair[]
  votes?: number
}

export interface STVResult extends VoteResult {
  quota: number
  complete: boolean
  randomized: boolean
  rounds: {
    status: 'Excluded' | 'Elected'
    selected: number[]
    method: 'Direct' | 'Tiebreak (Random)' | 'No competition left'
    vote_count: [number, number][]
  }[]
  runtime: number
}

export type PollBaseSettings = Pick<Poll, 'title' | 'p_ord' | 'withheld_result'>

export interface SimplePoll extends Poll {
  method_name: 'combined_simple'
  result?: VoteResult & {
    results: Record<number, Record<SimpleChoice, number>>
  }
  settings: null
}

export interface SchulzePoll extends Poll {
  method_name: 'schulze'
  result?: SchulzeResult
  settings: {
    stars?: number
    deny_proposal?: boolean
  }
}

export interface MajorityPoll extends Poll {
  method_name: 'majority'
  result?: VoteResult & {
    results: { proposal: number; votes: number }[]
  }
  settings: null
}

export interface RepeatedSchulzePoll extends Poll {
  method_name: 'repeated_schulze'
  result?: VoteResult & {
    rounds: SchulzeResult[]
    candidates: number[]
  }
  settings: {
    stars?: number
    winners: number | null
  }
}

export interface ScottishSTVPoll extends Poll {
  method_name: 'scottish_stv'
  result?: STVResult
  settings: {
    winners: number
    allow_random: boolean
  }
}

export interface InstantRunoffPoll extends Poll {
  method_name: 'irv'
  result?: STVResult
  settings: {
    allow_random: boolean
  }
}

export interface RepeatedIRVPoll extends Poll {
  method_name: 'repeated_irv'
  result?: STVResult
  settings: {
    allow_random: boolean
    max: number | null
    min: number | null
    winners: number
  }
}

export interface ApprovalPoll extends Poll {
  method_name: 'dutt'
  result?: VoteResult & {
    results: {
      votes: number
      proposal: number
    }[]
  }
  settings: {
    min: number
    max: number
  }
}

export type PollStartData = Pick<
  Poll,
  | 'agenda_item'
  | 'meeting'
  | 'method_name'
  | 'p_ord'
  | 'proposals'
  | 'settings'
  | 'title'
  | 'withheld_result'
> & { start: boolean }
