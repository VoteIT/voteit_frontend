import { orderBy } from 'lodash'

import { WorkflowState, WorkflowStates } from './types'

export default function useWorkflows<S>(states: WorkflowStates<S>) {
  function getState(state: S): WorkflowState<S> | undefined {
    return states.find((s) => s.state === state)
  }

  function getPriorityStates(
    predicate?: (state: WorkflowState<S>) => boolean
  ): WorkflowState<S>[] {
    return orderBy(
      states.filter((s) => s.priority && (!predicate || predicate(s))),
      ['priority']
    )
  }

  return {
    getState,
    getPriorityStates
  }
}
