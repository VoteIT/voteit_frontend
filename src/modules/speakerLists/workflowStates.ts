import { WorkflowStates } from '@/contentTypes/types'
import { ThemeColor } from '@/utils/types'
import { SpeakerListState, SpeakerSystemState } from './types'

export const speakerSystemStates: WorkflowStates<
  SpeakerSystemState,
  'inactivate' | 'activate' | 'archive'
> = [
  {
    transition: 'inactivate',
    icon: 'mdi-eye-off',
    state: SpeakerSystemState.Inactive,
    getName(t, count = 1) {
      return t('speaker.systemWorkflow.inactive', count)
    }
  },
  {
    transition: 'activate',
    icon: 'mdi-eye',
    state: SpeakerSystemState.Active,
    getName(t, count = 1) {
      return t('speaker.systemWorkflow.active', count)
    }
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: SpeakerSystemState.Archived,
    getName(t, count = 1) {
      return t('speaker.systemWorkflow.archived', count)
    }
  }
]

export const speakerListStates: WorkflowStates<
  SpeakerListState,
  'open' | 'close'
> = [
  {
    transition: 'open',
    icon: 'mdi-play-circle-outline',
    state: SpeakerListState.Open,
    color: ThemeColor.Primary,
    getName(t, count = 1) {
      return t('speaker.listWorkflow.open', count)
    }
  },
  {
    transition: 'close',
    icon: 'mdi-lock',
    state: SpeakerListState.Closed,
    color: ThemeColor.Warning,
    getName(t, count = 1) {
      return t('speaker.listWorkflow.closed', count)
    }
  }
]
