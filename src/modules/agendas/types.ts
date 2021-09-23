import { ProposalState } from '@/contentTypes/proposal/workflowStates'

export interface Filter {
  order: string
  states: Set<ProposalState>
  tags: Set<string>
}
