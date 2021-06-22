import { WorkflowState } from '../types'

export enum UserState {
  Incomplete = 'incomplete',
  Active = 'active'
}

export default [
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
] as WorkflowState[]
