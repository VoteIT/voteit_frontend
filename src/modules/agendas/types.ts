/* eslint-disable camelcase */
import { MenuItem } from '@/utils/types'
import { ComponentPublicInstance, ComputedRef } from 'vue'
import { ComposerTranslation } from 'vue-i18n'
import { MeetingPlugin } from '../meetings/PluginHandler'
import { Meeting } from '../meetings/types'
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
  meeting: number
  readonly order: number
  readonly related_modified: string | null
  state: AgendaState
  tags: string[]
  title: string
}

export interface AgendaBody {
  pk: number
  body: string
}

export interface Filter {
  order: 'asc' | 'desc'
  states: Set<ProposalState>
  tags: Set<string>
}

export type AgendaFilterComponent = ComponentPublicInstance<{ setTag:(tag: string) => void, isModified: ComputedRef<boolean>, clearFilters: () => {} }>

export interface AgendaMenuPlugin extends MeetingPlugin {
  getItems (context: {
    agendaItem: AgendaItem,
    agendaItemPath: string,
    meeting: Meeting,
    menu: string,
    t: ComposerTranslation
  }): MenuItem[]
}
