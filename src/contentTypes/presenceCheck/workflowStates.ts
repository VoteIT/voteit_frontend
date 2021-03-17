import { WorkflowState } from '../types'

export enum PresenceCheckState {
  Open = 'open',
  Closed = 'closed',
}

const workflowStates: WorkflowState[] = [
  {
    transition: 'open',
    icon: 'mdi-play',
    state: PresenceCheckState.Open
  },
  {
    transition: 'close',
    icon: 'mdi-stop',
    state: PresenceCheckState.Closed,
    isFinal: true
  }
]

export default workflowStates
