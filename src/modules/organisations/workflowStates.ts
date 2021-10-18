import { WorkflowState } from '../../contentTypes/types'
import { UserState } from './types'

export const userStates: WorkflowState[] = [
  {
    transition: 'incomplete',
    icon: 'mdi-progress-alert',
    state: UserState.Incomplete
  },
  {
    transition: 'activate',
    icon: 'mdi-check-all',
    state: UserState.Active
  }
]
