import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { ComponentPublicInstance, ComputedRef } from 'vue'

export interface Filter {
  order: string
  states: Set<ProposalState>
  tags: Set<string>
}

export type AgendaFilterComponent = ComponentPublicInstance<{ setTag:(tag: string) => void, isModified: ComputedRef<boolean>, clearFilters: () => {} }>
