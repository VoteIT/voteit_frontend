/* eslint-disable camelcase */
import { ComponentPublicInstance, ComputedRef } from 'vue'
import { ProposalState } from '../proposals/types'

export enum AgendaState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archived = 'archived'
}

export interface AgendaItem {
  pk: number
  block_proposals: boolean
  block_discussion: boolean
  body: string
  meeting: number
  readonly order: number
  readonly related_modified: Date | null
  state: AgendaState
  tags: string[]
  title: string
}

export interface Filter {
  order: string
  states: Set<ProposalState>
  tags: Set<string>
}

export type AgendaFilterComponent = ComponentPublicInstance<{ setTag:(tag: string) => void, isModified: ComputedRef<boolean>, clearFilters: () => {} }>
