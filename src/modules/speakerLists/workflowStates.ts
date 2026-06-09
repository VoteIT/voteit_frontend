import { WorkflowStates } from '@/contentTypes/types'
import { SpeakerSystemState } from './types'

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
