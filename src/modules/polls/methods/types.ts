/* eslint-disable camelcase */
import { BaseContent } from '@/contentTypes/types'
import { ThemeColor } from '@/utils/types'
import { PollState } from '../types'

enum PollCriteria {
  MajorityWinner = 'majorityWinner',
  MajorityLoser = 'majorityLoser',
  MutualMajority = 'mutualMajority',
  CondorcetWinner = 'condorcetWinner',
  CondorcetLoser = 'condorcetLoser',
  CloneProof = 'cloneProof',
  Proportional = 'proportional'
}

export const Conditional = Symbol('conditional')
export type PollMethodCriterion = Partial<Record<PollCriteria, boolean | typeof Conditional>>

interface VoteResult {
  approved: number[]
  denied: number[]
  vote_count: number
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

export interface SimpleChoiceDesc {
  value: SimpleChoice
  icon: string
  translationString: string
  color: ThemeColor
}

export const simpleChoices: SimpleChoiceDesc[] = [
  {
    value: SimpleChoice.Yes,
    icon: 'mdi-thumb-up',
    translationString: 'poll.approve',
    color: ThemeColor.Success
  },
  {
    value: SimpleChoice.No,
    icon: 'mdi-thumb-down',
    translationString: 'poll.deny',
    color: ThemeColor.Warning
  },
  {
    value: SimpleChoice.Abstain,
    icon: 'mdi-cancel',
    translationString: 'poll.abstain',
    color: ThemeColor.Secondary
  }
]

export type SimpleProposalResult = Record<SimpleChoice, number>
type SimpleResultMap = Record<number, SimpleProposalResult>

export interface CombinedSimpleResult extends VoteResult {
  results: SimpleResultMap
}

export interface MajorityResult extends VoteResult {
  results: { proposal: number, votes: number }[]
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

export interface RepeatedSchulzeResult extends VoteResult {
  rounds: SchulzeResult[]
  candidates: number[]
}

type ScottishSTVVoteCount = [number, number]

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
export type InstantRunoffResult = ScottishSTVResult

export type MajorityVote = { choice: number }
export type SimpleVote = Record<SimpleChoice, number[]>

export interface DuttSettings {
  min: number
  max: number
}

export interface RepeatedSchulzeSettings {
  winners: number | null
}

export interface ScottishSTVSettings {
  winners: number
  allow_random: boolean
}

export interface InstantRunoffSettings {
  allow_random: boolean
}

export interface SchulzeSettings {
  stars?: number
  deny_proposal?: boolean
}

export type PollMethodSettings = RepeatedSchulzeSettings | ScottishSTVSettings | InstantRunoffSettings | SchulzeSettings | DuttSettings

// Poll format from API
interface BasePoll extends BaseContent {
  abstain_count?: number // Only finished polls
  agenda_item: number
  body: string | null
  closed: Date | null
  electoral_register?: number
  initial_electoral_register?: number
  meeting: number
  method_name: string
  proposals: number[]
  result: VoteResult
  settings: unknown
  state: PollState
  started: Date | null
}

export interface SimplePoll extends BasePoll {
  method_name: 'combined_simple'
  result: CombinedSimpleResult
  settings: null
}

export interface SchulzePoll extends BasePoll {
  method_name: 'schulze'
  result: SchulzeResult
  settings: SchulzeSettings
}

export interface MajorityPoll extends BasePoll {
  method_name: 'majority'
  result: MajorityResult
  settings: null
}

export interface RepeatedSchulzePoll extends BasePoll {
  method_name: 'repeated_schulze'
  result: RepeatedSchulzeResult
  settings: RepeatedSchulzeSettings
}

export interface ScottishSTVPoll extends BasePoll {
  method_name: 'scottish_stv'
  result: ScottishSTVResult
  settings: ScottishSTVSettings
}

export interface InstantRunoffPoll extends BasePoll {
  method_name: 'irv'
  result: ScottishSTVResult // TODO: Rename to something more general
  settings: InstantRunoffSettings
}

export interface DuttVote {
  choices: number[]
}

export interface DuttResult extends VoteResult {
  results: {
    votes: number,
    proposal: number
  }[]
}

export interface DuttPoll extends BasePoll {
  method_name: 'dutt'
  result: DuttResult
  settings: DuttSettings
}

export type Poll = MajorityPoll | SchulzePoll | RepeatedSchulzePoll | SimplePoll | ScottishSTVPoll | InstantRunoffPoll | DuttPoll
export type PollStartData = Pick<Poll, 'agenda_item' | 'meeting' | 'method_name' | 'proposals' | 'settings' | 'title'> & { start: boolean }
