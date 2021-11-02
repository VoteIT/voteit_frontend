import { WorkflowState } from '@/contentTypes/types'
import { ThemeColor } from '@/utils/types'
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
    icon: 'mdi-play-circle-outline',
    state: SpeakerListState.Open,
    color: ThemeColor.Primary
  },
  {
    transition: 'close',
    icon: 'mdi-lock',
    state: SpeakerListState.Closed,
    color: ThemeColor.Warning
  }
]
