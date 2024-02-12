import { chain, filter, first, imap } from 'itertools'
import { ComposerTranslation } from 'vue-i18n'

import DefaultMap from '@/utils/DefaultMap'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

import ContentAPI from './ContentAPI'
import type { Transition as ITransition, WorkflowStates } from './types'

export const UnguardedTransition = Symbol('UnguardedTransition')

type GuardTrigger = { text: string; isBlocking?: boolean }
type TransitionGuard<T> = (
  obj: T,
  t: ComposerTranslation
) => GuardTrigger | undefined

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

  function isGuardTrigger(value?: GuardTrigger): value is GuardTrigger {
    return !!value
  }

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
    const action = () =>
      api.action<Partial<T>>(obj.pk, 'transitions', { transition })
    if (t === UnguardedTransition) return await action()
    const guardQuery = checkGuards(obj, transition, t)
    if (!guardQuery) return action()
    const dialog = { title: guardQuery.text, theme: ThemeColor.Warning }
    if (guardQuery.isBlocking) {
      dialogQuery({ ...dialog, no: false, yes: t('ok') })
      return
    }
    if (await dialogQuery(dialog)) return await action()
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
    const triggeredGuards = filter(
      imap(chain(guards.get('*'), guards.get(transition)), (guard) =>
        guard(obj, t)
      ),
      isGuardTrigger
    )
    // First non-overridable or first triggered
    return (
      first(triggeredGuards, (g) => !!g?.isBlocking) ?? first(triggeredGuards)
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
