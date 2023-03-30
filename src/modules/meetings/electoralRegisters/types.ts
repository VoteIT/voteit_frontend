export interface ElectoralRegister {
  pk: number
  created: string
  meeting: number
  source?: string
  weights: {
    user: number
    weight: number
  }[]
}

export interface ErMethod {
  allow_manual: boolean
  allow_trigger: boolean
  available: boolean
  description: string
  // If boolean, it requires the same setting on the meeting
  group_votes_active?: boolean
  handles_active_check: boolean
  handles_vote_weight: boolean
  name: string
  title: string
}
