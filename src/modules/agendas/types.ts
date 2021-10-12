/* eslint-disable camelcase */
import { AgendaState } from '@/contentTypes/agendaItem/workflowStates'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { ComponentPublicInstance, ComputedRef } from 'vue'

export interface AgendaItem {
  pk: number
  title: string
  state: AgendaState
  readonly related_modified: Date | null
  meeting: number
  readonly order: number
  body: string
  block_proposals: boolean
  block_discussion: boolean
}

export interface Filter {
  order: string
  states: Set<ProposalState>
  tags: Set<string>
}

export type AgendaFilterComponent = ComponentPublicInstance<{ setTag:(tag: string) => void, isModified: ComputedRef<boolean>, clearFilters: () => {} }>
