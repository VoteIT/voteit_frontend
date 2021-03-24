import { WorkflowState } from '../types'

export enum SpeakerSystemState {
  Inactive = 'inactive',
  Active = 'active',
  Archived = 'archived'
}

const workflowStates: WorkflowState[] = [
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

export default workflowStates
