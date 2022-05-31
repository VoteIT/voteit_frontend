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

export interface ErDefinition {
  allowManual?: boolean
  name: string
}
