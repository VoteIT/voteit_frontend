import { WorkflowState } from '@/contentTypes/types'

import { SpeakerSystemState } from './types'

export const speakerSystemWorkflows: WorkflowState[] = [
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
