/* eslint-disable camelcase */
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

export interface SingleSimpleVote {
  choice: SimpleChoice
}

export type CombinedSimpleVote = {
  [ key in SimpleChoice ]: number[]
}

export type SimpleVote = SingleSimpleVote | CombinedSimpleVote

export interface PollMethod {
  name: string
  title: string
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin?: number
  winnersMin?: number
  losersMin?: number
  initialSettings?: PollMethodSettings
}

export const pollMethods: PollMethod[] = [
  {
    name: 'simple',
    title: 'Simple majority',
    proposalsMax: 1
  },
  {
    name: 'combined_simple',
    title: 'Approve or deny',
    proposalsMin: 2
  },
  {
    name: 'schulze',
    title: 'Schulze',
    proposalsMin: 3
  },
  {
    name: 'repeated_schulze',
    title: 'Repeated Schulze',
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    initialSettings: {
      winners: 2,
      orderAll: false
    }
  },
  {
    name: 'scottish_stv',
    title: 'Scottish STV',
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    losersMin: 1,
    initialSettings: {
      winners: 2
    }
  },
  {
    name: 'irv',
    title: 'Instant-Runoff Voting',
    proposalsMin: 3
  }
]

export interface PollMethodSettings {
  winners: number | null
  orderAll?: boolean
}

/*
 * Post data sent to API
 */
export interface PollData {
  settings: PollMethodSettings | null
  agenda_item: number
  proposal_pks: string // FIXME Really
  method_name: string
  start: boolean
}
