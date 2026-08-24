import { any } from 'itertools'

import ProgressPromise from '@/utils/ProgressPromise'
import TypedEvent from '@/utils/TypedEvent'
import type { Progress, ProgressHandler, ValueOf } from '@/utils/types'

import { socket } from '.'
import { SocketState } from './types'
import type { IChannelsMessage } from './types'

function* count(): Generator<number, number> {
  let n = 0
  while (true) yield ++n
}

export enum ErrorStatus {
  NotFound = 404,
  Timeout = 408
}

export class SubscribeError extends Error {
  public status: number

  constructor(status: ErrorStatus, message?: string) {
    super(message ?? ErrorStatus[status])
    this.status = status
  }
}

export function isSubscribeError(err: unknown): err is SubscribeError {
  return err instanceof SubscribeError
}

interface IChannelOptions {
  leaveTimeout: number
  subscribeTimeout: number
}

/**
 * Identifies a channel: its type name plus the object's pk.
 */
export interface ChannelRef {
  channel_type: string
  pk: number
}

export type SubscribedPayload = ChannelRef & {
  channel_name: string
  channel_type: string
  collectors: string[]
}
type SubscribeErrorPayload = ChannelRef & { detail?: string }

/**
 * One collector's messages inside a 'channel.state' frame. `complete` is false
 * when the collector's output continues in the next bundle, and `failed` means
 * it raised - what's here is still valid, just not all of it.
 */
interface BundleSection {
  complete: boolean
  failed: boolean
  messages: IChannelsMessage[]
  name: string
}

type StatePayload = ChannelRef & { seq: number; sections: BundleSection[] }

type ChannelHandler = (action: string, payload: ChannelRef) => void

/**
 * Where a channel id is in the subscription process. Subscribed means the
 * server has accepted us; the initial state arrives after that, and only
 * Complete means there's something to show.
 */
const Status = {
  Subscribing: 0,
  Subscribed: 1,
  Complete: 2
} as const
type Status = ValueOf<typeof Status>

const DEFAULT_OPTIONS = {
  leaveTimeout: 5_000, // 5 secs
  subscribeTimeout: 20_000 // 20 secs
} as const

/**
 * All subscription control goes over the 'channel' type, so messages are
 * dispatched to the channel named by the payload rather than by message type.
 */
const channelHandlers = new Map<string, ChannelHandler>()

/**
 * Every channel the server has accepted us on, keyed by "<type>/<pk>".
 *
 * An entry appears on 'subscribed', just before the channel's state arrives,
 * and is dropped in registerLeave - either because the server threw us out, or
 * because the last local subscriber went away. A dropped connection leaves the
 * entry alone: the subscription is restored on reconnect, so the content it
 * delivered stays valid, and a leave while offline still finds its entry and
 * cleans up after itself.
 */
const subscribedChannels = new Map<string, SubscribedPayload>()

function channelKey({ channel_type, pk }: ChannelRef) {
  return `${channel_type}/${pk}`
}

/**
 * The channels currently subscribed, across every defined channel. Content
 * belonging to one of these is still covered by a live subscription.
 */
export function getSubscribedChannels(): Iterable<ChannelRef> {
  return subscribedChannels.values()
}

/**
 * Emitted just before a channel's initial state is applied - the point where
 * anything left from an earlier subscription to the same channel is stale. The
 * state follows synchronously, in the same tick, so a listener that clears
 * that content never leaves the views empty for a frame. The channel counts as
 * subscribed well before this, so a listener clearing content has to disregard
 * this very channel. Use a channel's onSubscribe to hear about state that has
 * arrived.
 */
export const beforeChannelStateEvent = new TypedEvent<SubscribedPayload>()
/** Emitted when a channel is left, on our request or because access was lost. */
export const channelLeftEvent = new TypedEvent<SubscribedPayload>()

socket.registerTypeHandler('channel', ({ action, payload }) => {
  const ref = payload as ChannelRef
  const handler = channelHandlers.get(ref.channel_type)
  if (!handler)
    return console.warn(`No channel defined for '${ref.channel_type}'`, payload)
  handler(action, ref)
})

/**
 * Create a subscribtion handler for a named channel.
 * @param name Namespace of this channel
 */
export default function defineChannel(
  name: string,
  opts?: Partial<IChannelOptions>
) {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const onSubscribedCallbacks = new Set<(payload: SubscribedPayload) => void>()
  const onLeftCallbacks = new Set<(payload: SubscribedPayload) => void>()
  // Map subscription id to channel id
  const subscriptions = new Map<number, number>()
  const subscribedCallbacks = new Map<number, (() => void)[]>()
  const subscribeErrorCallbacks = new Map<
    number,
    ((payload: SubscribeErrorPayload) => void)[]
  >()
  const progressCallbacks = new Map<number, ProgressHandler[]>()
  const idGenerator = count()

  // Track state here rather than in the subscription promise, so a
  // resubscribe after reconnect is registered even though nobody awaits it
  const status = new Map<number, Status>()

  // Initial state held back per channel id, see the 'state' action below. An
  // entry exists exactly while a subscription is being delivered, so it
  // doubles as the mark of one in progress.
  const stateQueue = new Map<number, IChannelsMessage[]>()

  // How much of the initial state has arrived, per channel id: the collectors
  // the subscription announced, and how many of them are done. Lives exactly
  // as long as the stateQueue does - there's no progress to report outside a
  // delivery.
  const progress = new Map<number, { collectors: Set<string>; curr: number }>()

  /**
   * Registers callback, setting callbacks Array when needed
   */
  function registerCallback<Fn extends (...args: never[]) => unknown>(
    map: Map<number, Fn[]>,
    id: number,
    cb: Fn
  ) {
    if (!map.has(id)) map.set(id, [])
    map.get(id)!.push(cb)
  }

  /**
   * Where the initial state delivery has got to, or undefined when nothing is
   * being delivered for this channel id.
   */
  function currentProgress(pk: number): Progress | undefined {
    const state = progress.get(pk)
    if (!state) return
    return { curr: state.curr, total: state.collectors.size }
  }

  /**
   * Report delivery progress to everyone awaiting this channel id.
   */
  function emitProgress(pk: number) {
    const payload = currentProgress(pk)
    if (!payload) return
    for (const cb of progressCallbacks.get(pk) ?? []) cb(payload)
  }

  /**
   * Forget a channel we're no longer on, whether we asked to leave or the
   * server threw us out. Silent for a subscription that never completed:
   * nothing was ever delivered on it, so nobody has anything to clean up.
   */
  function registerLeave(pk: number) {
    status.delete(pk)
    stateQueue.delete(pk)
    progress.delete(pk)
    const key = channelKey({ channel_type: name, pk })
    const payload = subscribedChannels.get(key)
    if (!payload) return
    subscribedChannels.delete(key)
    channelLeftEvent.emit(payload)
    for (const cb of onLeftCallbacks) cb(payload)
  }

  /**
   * Swap in the state that was held back: clear out what the channel's
   * previous subscription left behind, then hand the queue to the type
   * handlers as if it had just arrived on the wire. Both in the same tick, so
   * no view ever renders the channel emptied or half filled.
   */
  function applyState(payload: SubscribedPayload) {
    const queued = stateQueue.get(payload.pk) ?? []
    stateQueue.delete(payload.pk)
    beforeChannelStateEvent.emit(payload)
    for (const message of queued) socket.receive(message)
  }

  if (channelHandlers.has(name))
    throw new Error(`Channel '${name}' is already defined`)
  channelHandlers.set(name, (action, payload) => {
    const { pk } = payload
    switch (action) {
      case 'subscribed':
        status.set(pk, Status.Subscribed)
        // A fresh queue, dropping what an attempt that never completed left
        stateQueue.set(pk, [])
        progress.set(pk, {
          collectors: new Set((payload as SubscribedPayload).collectors ?? []),
          curr: 0
        })
        emitProgress(pk)
        subscribedChannels.set(
          channelKey(payload),
          payload as SubscribedPayload
        )
        break
      case 'state': {
        // App state is recieved here in bundles, and is queued until
        // state_complete: applying a bundle as it lands would show the views a
        // channel that's only partly there. Without a queue there's no
        // subscription left for it to complete, so the bundle is dropped
        // rather than kept around forever.
        const queue = stateQueue.get(pk)
        if (!queue) break
        const state = progress.get(pk)
        for (const section of (payload as StatePayload).sections ?? []) {
          if (section.failed)
            console.warn(
              `App state section '${section.name}' failed on ${name}/${pk}`
            )
          // A section nobody announced can't be counted without pushing the
          // progress past its total, so only say so
          if (state && !state.collectors.has(section.name))
            console.warn(
              `App state section '${section.name}' was not among the collectors of ${name}/${pk}`
            )
          else if (state && section.complete) state.curr++
          queue.push(...section.messages)
        }
        emitProgress(pk)
        break
      }
      case 'state_complete':
        // No queue means nothing is in flight - we've left, or this is a
        // repeat. Applying an empty state now would clear the channel for good.
        if (!stateQueue.has(pk)) break
        status.set(pk, Status.Complete)
        applyState(payload as SubscribedPayload)
        subscribedCallbacks.get(pk)?.map((cb) => cb())
        for (const cb of onSubscribedCallbacks) cb(payload as SubscribedPayload)
        break
      case 'subscribe_error':
        status.delete(pk)
        stateQueue.delete(pk)
        progress.delete(pk)
        subscribeErrorCallbacks
          .get(pk)
          ?.map((cb) => cb(payload as SubscribeErrorPayload))
        break
      case 'left':
        // Not resubscribing here: an unsolicited leave means access was
        // revoked, and asking again would only get us thrown out anew.
        registerLeave(pk)
        break
      default:
        console.error(`Unknown channel action: ${action}`, payload)
    }
  })

  socket.onReadyStateChanged((readyState) => {
    // A dropped connection is not a leave - the subscriptions below are
    // restored as soon as we're back - so subscribedChannels is left alone.
    if (readyState !== SocketState.Open) {
      // Half delivered state is worthless - resubscribing sends it all again
      stateQueue.clear()
      progress.clear()
      return status.clear()
    }
    const shouldSubscribeTo = new Set(subscriptions.values())
    for (const id of shouldSubscribeTo) performSubscribe(id)
  })

  /**
   * Create a Promise that resolves when channel is properly subscribed or
   * rejects on timeout. Its progress counts the collectors delivered so far.
   */
  function getSubscriptionPromise(id: number) {
    function clearCallbacks() {
      subscribeErrorCallbacks.delete(id)
      subscribedCallbacks.delete(id)
      progressCallbacks.delete(id)
    }

    return new ProgressPromise<void>((resolve, reject, setProgress) => {
      registerCallback(progressCallbacks, id, setProgress)
      // Joining a delivery already under way starts where it has got to,
      // rather than at nothing until the next bundle lands
      const started = currentProgress(id)
      if (started) setProgress(started)
      // If rejected, the promise will not resolve later, no matter what
      const timeout = setTimeout(() => {
        clearCallbacks()
        status.delete(id)
        reject(new SubscribeError(ErrorStatus.Timeout))
      }, options.subscribeTimeout)
      registerCallback(subscribedCallbacks, id, () => {
        clearTimeout(timeout)
        clearCallbacks()
        resolve()
      })
      registerCallback(subscribeErrorCallbacks, id, ({ detail }) => {
        clearTimeout(timeout)
        clearCallbacks()
        reject(new SubscribeError(ErrorStatus.NotFound, detail || undefined))
      })
    })
  }

  /**
   * Make sure channel is subscribed when there is a subscription.
   * @returns true if subscription should be under way
   */
  function performSubscribe(pk: number) {
    // status ensures that multiple subscribers can await the same subscription
    const current = status.get(pk)
    if (!any(subscriptions.values(), (v) => v === pk)) {
      if (socket.isOpen && current !== undefined)
        socket.send('channel.leave', { channel_type: name, pk })
      registerLeave(pk)
      return false
    }
    if (socket.isOpen && current === undefined) {
      status.set(pk, Status.Subscribing)
      socket.send('channel.subscribe', { channel_type: name, pk })
    }
    // Initial state is only there once the channel is complete, so a caller
    // joining a half finished subscription must await it too
    return current !== Status.Complete
  }

  /**
   * A subscription that's already been delivered: nothing left to wait for, so
   * it resolves at once, reporting every collector as done.
   */
  function getCompletedPromise(pk: number) {
    const total =
      subscribedChannels.get(channelKey({ channel_type: name, pk }))?.collectors
        ?.length || 1
    return new ProgressPromise<void>((resolve, _reject, setProgress) => {
      setProgress({ curr: total, total })
      resolve()
    })
  }

  /**
   * Subscribe to a channel. Caller must keep the leave() function in order to cancel subscription.
   * The handle is returned synchronously, so a subscription can be cancelled
   * while it's still pending - or after it has failed.
   */
  function subscribe(id: number) {
    const subscriptionId = idGenerator.next().value
    subscriptions.set(subscriptionId, id)
    return {
      promise: performSubscribe(id)
        ? getSubscriptionPromise(id)
        : getCompletedPromise(id),
      leave() {
        if (!subscriptions.has(subscriptionId))
          throw new Error(`Subscription is already canceled`)
        subscriptions.delete(subscriptionId)
        setTimeout(() => performSubscribe(id), options.leaveTimeout)
      }
    }
  }

  /**
   * Listen to every completed subscription on this channel, including
   * resubscriptions after a reconnect.
   * @returns dispose method
   */
  function onSubscribe(cb: (payload: SubscribedPayload) => void) {
    onSubscribedCallbacks.add(cb)
    return () => {
      onSubscribedCallbacks.delete(cb)
    }
  }

  /**
   * Listen to channels left, on request or because access was lost.
   * @returns dispose method
   */
  function onLeave(cb: (payload: SubscribedPayload) => void) {
    onLeftCallbacks.add(cb)
    return () => {
      onLeftCallbacks.delete(cb)
    }
  }

  return {
    name,
    onLeave,
    onSubscribe,
    subscribe
  }
}
