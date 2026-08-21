import { any } from 'itertools'

import type { ValueOf } from '@/utils/types'

import { socket } from '.'
import { SocketState } from './types'

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
interface ChannelRef {
  channel_type: string
  pk: number
}

export type SubscribedPayload = ChannelRef & { channel_name: string }
type SubscribeErrorPayload = ChannelRef & { detail?: string }

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
  const idGenerator = count()

  // Track state here rather than in the subscription promise, so a
  // resubscribe after reconnect is registered even though nobody awaits it
  const status = new Map<number, Status>()

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

  if (channelHandlers.has(name))
    throw new Error(`Channel '${name}' is already defined`)
  channelHandlers.set(name, (action, payload) => {
    const { pk } = payload
    switch (action) {
      case 'subscribed':
        status.set(pk, Status.Subscribed)
        break
      case 'state_complete':
        status.set(pk, Status.Complete)
        subscribedCallbacks.get(pk)?.map((cb) => cb())
        for (const cb of onSubscribedCallbacks) cb(payload as SubscribedPayload)
        break
      case 'subscribe_error':
        status.delete(pk)
        subscribeErrorCallbacks
          .get(pk)
          ?.map((cb) => cb(payload as SubscribeErrorPayload))
        break
      case 'left':
        // Not resubscribing here: an unsolicited leave means access was
        // revoked, and asking again would only get us thrown out anew.
        status.delete(pk)
        for (const cb of onLeftCallbacks) cb(payload as SubscribedPayload)
        break
      default:
        console.error(`Unknown channel action: ${action}`, payload)
    }
  })

  socket.onReadyStateChanged((readyState) => {
    if (readyState !== SocketState.Open) return status.clear()
    const shouldSubscribeTo = new Set(subscriptions.values())
    for (const id of shouldSubscribeTo) performSubscribe(id)
  })

  /**
   * Create a Promise that resolves when channel is properly subscribed or rejects on timeout.
   */
  function getSubscriptionPromise(id: number) {
    function clearCallbacks() {
      subscribeErrorCallbacks.delete(id)
      subscribedCallbacks.delete(id)
    }

    return new Promise<void>((resolve, reject) => {
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
    const shouldSubscribe = any(subscriptions.values(), (v) => v === pk)
    if (socket.isOpen) {
      if (!shouldSubscribe && current !== undefined) {
        status.delete(pk)
        socket.send('channel.leave', { channel_type: name, pk })
      }
      if (shouldSubscribe && current === undefined) {
        status.set(pk, Status.Subscribing)
        socket.send('channel.subscribe', { channel_type: name, pk })
      }
    }
    // Initial state is only there once the channel is complete, so a caller
    // joining a half finished subscription must await it too
    return shouldSubscribe && current !== Status.Complete
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
        : Promise.resolve(),
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
