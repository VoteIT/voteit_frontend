import { AxiosPromise } from 'axios'
import ContentAPI from './ContentAPI'
import type { Transition as ITransition, WorkflowStates } from './types'

/**
 * Handle content type transitions
 */
export default function useTransitions<
  T extends { pk: number; state?: string },
  Transition extends string
>(states: WorkflowStates<T['state'], Transition>, api: ContentAPI<T, number>) {
  async function get(pk: number): Promise<ITransition<Transition>[]> {
    const { data } = await api.action<ITransition<Transition>[]>(
      pk,
      'transitions',
      undefined,
      'get'
    )
    return data.map((t) => ({
      ...t,
      icon: states.find((s) => s.transition === t.name)?.icon
    }))
  }

  function make(pk: number, transition: Transition): AxiosPromise<Partial<T>> {
    return api.action(pk, 'transitions', { transition })
  }

  return {
    states,
    get,
    make
  }
}
