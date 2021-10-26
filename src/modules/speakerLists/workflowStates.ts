import { WorkflowState } from '@/contentTypes/types'
import { SpeakerListState, SpeakerSystemState } from './types'

export const speakerSystemStates: WorkflowState<SpeakerSystemState>[] = [
  {
    transition: 'inactivate',
    icon: 'mdi-eye-off',
    state: SpeakerSystemState.Inactive
  },
  {
    transition: 'activate',
    icon: 'mdi-eye',
    state: SpeakerSystemState.Active
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: SpeakerSystemState.Archived
  }
]

export const speakerListStates: WorkflowState<SpeakerListState>[] = [
  {
    transition: 'open',
    icon: 'mdi-check',
    state: SpeakerListState.Open
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: SpeakerListState.Closed
  }
]
