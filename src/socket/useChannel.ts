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
 * `onProgress` to it to follow the channel's collectors as they complete.
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
  })

  return {
    promise,
    subscribeError,
    state,
    subscribed: computed(() => state.value === 'subscribed'),
    subscribing: computed(() => state.value === 'subscribing')
  }
}
