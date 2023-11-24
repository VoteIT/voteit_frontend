import { partition } from 'itertools'
import { ComposerTranslation } from 'vue-i18n'

import DefaultMap from '@/utils/DefaultMap'

import ContentAPI from './ContentAPI'
import type { Transition as ITransition, WorkflowStates } from './types'

type TransitionGuard<T> = (
  obj: T,
  t: ComposerTranslation
) => { blocking?: boolean; message: string } | undefined

/**
 * Handle content type transitions
 */
export default function useTransitions<
  T extends { pk: number; state?: string },
  Transition extends string
>(states: WorkflowStates<T['state'], Transition>, api: ContentAPI<T, number>) {
  const guards = new DefaultMap<Transition | '*', TransitionGuard<T>[]>(
    () => []
  )

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

  function make(pk: number, transition: Transition) {
    return api.action<Partial<T>>(pk, 'transitions', { transition })
  }

  function registerGuard(transition: Transition, guard: TransitionGuard<T>) {
    guards.get(transition).push(guard)
  }

  /**
   * Check all registered transition guards. Undefined if all is OK.
   */
  function checkGuards(
    obj: T,
    transition: Transition | '*',
    t: ComposerTranslation
  ) {
    function* iterGuards() {
      for (const guard of guards.get(transition)) {
        const result = guard(obj, t)
        if (result) yield result
      }
    }
    // Check blocking guards first
    const [blocking, nonBlocking] = partition(iterGuards(), (m) => !!m.blocking)
    return blocking.at(0) ?? nonBlocking.at(0)
  }

  return {
    states,
    checkGuards,
    get,
    make,
    registerGuard
  }
}
