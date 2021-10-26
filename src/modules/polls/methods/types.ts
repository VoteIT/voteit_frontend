/* eslint-disable camelcase */
import { ThemeColor } from '@/utils/types'

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
export type SimpleVote = CombinedSimpleVote

interface BasePollMethodSettings {
  title?: string
}

export interface RepeatedSchulzeSettings extends BasePollMethodSettings {
  winners: number | null
}

export interface ScottishSTVSettings extends BasePollMethodSettings {
  winners: number
  allow_random: boolean
}

interface InstantRunoffSettings extends BasePollMethodSettings {
  allow_random: boolean
}

export type PollMethodSettings = BasePollMethodSettings | RepeatedSchulzeSettings | ScottishSTVSettings | InstantRunoffSettings

export interface PollMethod {
  name: PollMethodName
  title: string
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin?: number
  winnersMin?: number
  losersMin?: number
  initialSettings?: PollMethodSettings
  settingsValidator?: (settings: PollMethodSettings) => PollMethodSettings,
  disabled?: boolean, // Annotated in getPollMethods(proposalCount)
  quickStart?: boolean // Available for quick start, i.e. in plenary view
}

/*
 * Post data sent to API
 */
export interface PollStartData {
  agenda_item: number
  meeting: number
  title?: string
  proposals: number[]
  method_name: PollMethodName
  start: boolean
  settings: PollMethodSettings | null
}
