import { ValueOf } from '@/utils/types'

export const ProposalIntent = {
  APPROVE: 'a',
  BLANK: '',
  DENY: 'd'
} as const

export interface IProposalNote {
  agenda_item: number // Does not exist yet
  body: string
  created: string
  intent: ValueOf<typeof ProposalIntent>
  meeting: number
  pk: number
  proposal: number
  user: number
}
