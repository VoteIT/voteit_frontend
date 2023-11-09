import { WorkflowState } from '@/contentTypes/types'

export enum PresenceCheckState {
  Open = 'open',
  Closed = 'closed'
}

export const presenceCheckStates: WorkflowState<PresenceCheckState>[] = [
  {
    transition: 'open',
    icon: 'mdi-play',
    state: PresenceCheckState.Open,
    getName(t) {
      return t('presence.workflow.open')
    }
  },
  {
    transition: 'close',
    icon: 'mdi-stop',
    state: PresenceCheckState.Closed,
    isFinal: true,
    getName(t) {
      return t('presence.workflow.closed')
    }
  }
]
