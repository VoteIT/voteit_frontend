import { computed, onUnmounted, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'

import ProgressPromise from '@/utils/ProgressPromise'
import type { ProgressHandler } from '@/utils/types'

import type defineChannel from './defineChannel'
import { ErrorStatus, isSubscribeError } from './defineChannel'

type Channel = ReturnType<typeof defineChannel>

/**
 * Subscribe to a channel, keeping the subscription in sync with `channel` and `id`.
 *
 * Both arguments may be reactive: switching either one leaves the current
 * subscription and subscribes to the new target. Unsubscribes on unmount.
 *
 * Subscription failures are reported through `state` and `subscribeError` -
 * how to act on them is up to the caller.
 *
 * `promise` reports how much of the initial state has arrived: attach
 * `onProgress` to it to follow the channel's collectors as they complete. It
 * covers the first subscription attempt only, and resolves right away if there
 * was nothing to subscribe to. Callers whose target appears later - once a
 * fetch has settled what to subscribe to - want `whenSettled` instead.
 *
 * @param channel Channel to subscribe to, static or reactive
 * @param pk Primary key of the object to subscribe to
 */
export default function useChannel(
  channel: MaybeRefOrGetter<Channel | undefined>,
  pk: Ref<number | undefined>
) {
  const state = shallowRef<
    'failed' | 'subscribed' | 'subscribing' | 'unsubscribed'
  >('unsubscribed')
  const subscribeError = shallowRef<{ message: string; status: ErrorStatus }>()

  let subscription: ReturnType<Channel['subscribe']> | undefined
  // Bumped on every target change, so late subscriptions know they're obsolete
  let generation = 0

  // Settles once the first subscription attempt is done, successful or not
  let settle: () => void
  let setProgress: ProgressHandler
  const promise = new ProgressPromise<void>((resolve, _reject, progress) => {
    settle = resolve
    setProgress = progress
  })

  // Waiting on the attempt that's running now, rather than on the first one
  const settleWaiters = new Set<() => void>()

  function resolveWaiters() {
    for (const resolve of settleWaiters) resolve()
    settleWaiters.clear()
  }

  /**
   * Resolves once the current subscription attempt has settled - subscribed or
   * failed. Unlike `promise` it waits for a target to appear, so it's what to
   * await when the id or channel is only known after some other load.
   *
   * A failure resolves rather than rejects: a channel that isn't there is the
   * caller's to report, and a timed out one is retried on reconnect.
   *
   * Note that an attempt which has already settled resolves immediately, even
   * if the target is about to change.
   */
  function whenSettled() {
    return new Promise<void>((resolve) => {
      if (state.value === 'subscribed' || state.value === 'failed')
        return resolve()
      settleWaiters.add(resolve)
    })
  }

  // Only the current generation ever sets a settled state, so an attempt we've
  // moved on from can't release the waiters. Resubscriptions land here too.
  watch(state, (value) => {
    if (value === 'subscribed' || value === 'failed') resolveWaiters()
  })

  /**
   * Resolved subscription target, or undefined while channel or id is unset.
   */
  const target = computed(() => {
    const ch = toValue(channel)
    if (!ch?.name || !pk.value) return
    return { channel: ch, pk: pk.value, path: `${ch.name}/${pk.value}` }
  })

  /**
   * React to channel path changes
   */
  watch(
    () => target.value?.path,
    async () => {
      const current = ++generation
      state.value = 'unsubscribed'
      subscription?.leave()
      subscription = undefined
      const to = target.value
      if (!to) return settle()
      state.value = 'subscribing'
      subscribeError.value = undefined
      // Keep the handle before awaiting, so a pending or failed subscription
      // can still be left
      subscription = to.channel.subscribe(to.pk)
      // Pass on the delivery progress, unless we've moved on since
      subscription.promise.onProgress((progress) => {
        if (current === generation) setProgress(progress)
      })
      try {
        await subscription.promise
        if (current !== generation) return
        state.value = 'subscribed'
      } catch (e) {
        if (current !== generation) return
        state.value = 'failed'
        if (!isSubscribeError(e)) throw e
        subscribeError.value = { message: e.message, status: e.status }
      } finally {
        settle()
      }
    },
    { immediate: true }
  )

  // A timed out subscription may still arrive, and the channel resubscribes on
  // reconnect. The server may also throw us out when access is lost. All of
  // them bypass the promise above, so pick them up here.
  watch(
    () => target.value?.channel,
    (channel, _old, onCleanup) => {
      if (!channel) return
      const disposeSubscribe = channel.onSubscribe(({ pk }) => {
        if (pk !== target.value?.pk) return
        subscribeError.value = undefined
        state.value = 'subscribed'
      })
      const disposeLeave = channel.onLeave(({ pk }) => {
        if (pk !== target.value?.pk) return
        state.value = 'unsubscribed'
      })
      onCleanup(() => {
        disposeSubscribe()
        disposeLeave()
      })
    },
    { immediate: true }
  )

  onUnmounted(() => {
    generation++
    subscription?.leave()
    subscription = undefined
    // Whoever awaited this is going away with us; leaving them hanging would
    // stall the loader they belong to
    resolveWaiters()
  })

  return {
    promise,
    subscribeError,
    whenSettled,
    state,
    subscribed: computed(() => state.value === 'subscribed'),
    subscribing: computed(() => state.value === 'subscribing')
  }
}
