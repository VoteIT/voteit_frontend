export interface ElectoralRegister {
  pk: number
  created: Date
  meeting: number
  source?: string
  weights: {
    user: number
    weight: number
  }[]
}

export interface ErMethod {
  allow_manual: boolean
  available: boolean
  description: string
  handles_group_vote: boolean
  handles_personal_vote: boolean
  handles_vote_weight: boolean
  name: string
  title: string
}
