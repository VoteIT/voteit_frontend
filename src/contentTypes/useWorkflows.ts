import { orderBy } from '@/utils'
import { WorkflowState } from './types'

export default function useWorkflows (states: WorkflowState[]) {
  function getState (state: string): WorkflowState | undefined {
    return states.find(s => s.state === state)
  }

  function getPriorityStates (predicate?: (state: WorkflowState) => boolean): WorkflowState[] {
    return orderBy(states.filter(s => s.priority && (!predicate || predicate(s))), 'priority')
  }

  return {
    getState,
    getPriorityStates
  }
}
