import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { ComponentPublicInstance } from '@vue/runtime-core'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void,
  focus: () => void,
  clear: () => void
}>

export interface Filter {
  order: string
  states: Set<ProposalState>
  tags: Set<string>
}

export const DEFAULT_FILTER_STATES = [ProposalState.Published, ProposalState.Voting, ProposalState.Approved]
