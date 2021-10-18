import { WorkflowState } from '@/contentTypes/types'

export enum PresenceCheckState {
  Open = 'open',
  Closed = 'closed',
}

export const presenceCheckStates: WorkflowState[] = [
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
