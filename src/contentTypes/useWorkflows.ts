import { WorkflowState } from './types'

export default function useWorkflows (states: WorkflowState[]) {
  function getState (state: string) {
    return states.find(s => s.state === state)
  }

  return {
    getState
  }
}
