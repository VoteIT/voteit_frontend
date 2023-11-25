import { chain, first, imap } from 'itertools'
import { isString } from 'lodash'
import { ComposerTranslation } from 'vue-i18n'

import DefaultMap from '@/utils/DefaultMap'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

import ContentAPI from './ContentAPI'
import type { Transition as ITransition, WorkflowStates } from './types'

export const UnguardedTransition = Symbol('UnguardedTransition')
type TransitionGuard<T> = (obj: T, t: ComposerTranslation) => string | undefined

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

  async function make(
    obj: T,
    transition: Transition,
    t: ComposerTranslation | typeof UnguardedTransition
  ) {
    const guardQuery =
      t === UnguardedTransition ? undefined : checkGuards(obj, transition, t)
    if (
      !guardQuery ||
      (await dialogQuery({ title: guardQuery, theme: ThemeColor.Warning }))
    )
      return await api.action<Partial<T>>(obj.pk, 'transitions', { transition })
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
    return first(
      imap(chain(guards.get('*'), guards.get(transition)), (guard) =>
        guard(obj, t)
      ),
      isString
    )
  }

  return {
    states,
    checkGuards,
    get,
    make,
    registerGuard
  }
}
