/* eslint-disable camelcase */

import { Poll } from '@/contentTypes/types'

export enum PollMethodName {
  CombinedSimple = 'combined_simple',
  InstantRunoff = 'irv',
  RepeatedSchulze = 'repeated_schulze',
  // Simple = 'simple',
  Schulze = 'schulze',
  ScottishSTV = 'scottish_stv'
}

interface VoteResult {
  approved: number[]
  denied: number[]
}

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

export const simpleIcons: Record<SimpleChoice, string> = {
  abstain: 'mdi-cancel',
  yes: 'mdi-thumb-up',
  no: 'mdi-thumb-down'
}

export interface SingleSimpleVote {
  choice: SimpleChoice
}

export interface SimpleVoteResult extends VoteResult {
  yes: number
  no: number
}

export type CombinedSimpleProposalResult = {
  [ key in SimpleChoice ]: number
}

type CombinedSimpleResultMap = {
  [ key: string ]: CombinedSimpleProposalResult
}

export interface CombinedSimpleResult extends VoteResult {
  results: CombinedSimpleResultMap
}

type SchulzePair = [[number, number], number]

export interface SchulzeResult extends VoteResult {
  winner: number
  candidates: number[]
  tied_winners: number[] | null
  pairs: SchulzePair[]
  strong_pairs: SchulzePair[]
}

export interface RepeatedSchulzeResult extends VoteResult {
  rounds: SchulzeResult[]
  candidates: number[]
}

type ScottishSTVVoteCount = [number, string]

interface ScottishSTVRound {
  status: string
  selected: number[]
  method: string
  vote_count: ScottishSTVVoteCount[]
}

export interface ScottishSTVResult extends VoteResult {
  quota: number
  complete: boolean
  randomized: boolean
  rounds: ScottishSTVRound[]
  runtime: number
}

export type CombinedSimpleVote = Record<SimpleChoice, number[]>
export type SimpleVote = SingleSimpleVote | CombinedSimpleVote

export interface PollMethod {
  name: PollMethodName
  title: string
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin?: number
  winnersMin?: number
  losersMin?: number
  initialSettings?: PollMethodSettings
  settingsValidator?: (settings: PollMethodSettings) => PollMethodSettings
}

export const pollMethods: PollMethod[] = [
  {
    name: PollMethodName.CombinedSimple,
    title: 'Simple majority',
    proposalsMin: 1
  },
  {
    name: PollMethodName.Schulze,
    title: 'Schulze',
    proposalsMin: 3
  },
  {
    name: PollMethodName.RepeatedSchulze,
    title: 'Repeated Schulze',
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    initialSettings: {
      winners: 2
    }
  },
  {
    name: PollMethodName.ScottishSTV,
    title: 'Scottish STV',
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    losersMin: 1,
    initialSettings: {
      winners: 2,
      allow_random: true
    }
  },
  {
    name: PollMethodName.InstantRunoff,
    title: 'Instant-Runoff Voting',
    proposalsMin: 3
  }
]

export interface RepeatedSchulzeSettings {
  winners: number | null
}

export interface ScottishSTVSettings {
  winners: number
  allow_random: boolean
}

export type PollMethodSettings = RepeatedSchulzeSettings | ScottishSTVSettings

/*
 * Post data sent to API
 */
export interface PollStartData {
  agenda_item: number
  meeting: number
  proposals: number[]
  method_name: PollMethodName
  start: boolean
  settings: PollMethodSettings | null
}
