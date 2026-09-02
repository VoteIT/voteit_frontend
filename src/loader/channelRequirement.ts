import type { RouteLocationNormalized } from 'vue-router'

import { socket } from '@/socket'
import defineChannelDefault, {
  ErrorStatus,
  isSubscribeError
} from '@/socket/defineChannel'

import type { Requirement, RequirementFactory } from './types'

type Channel = ReturnType<typeof defineChannelDefault>

/** A route param read as a primary key, or undefined when it isn't one. */
export function paramPk(to: RouteLocationNormalized, name: string) {
  const value = to.params[name]
  if (typeof value !== 'string') return
  const pk = Number(value)
  return Number.isInteger(pk) && pk > 0 ? pk : undefined
}

/**
 * A requirement that holds a channel subscription and reports the delivery of
 * its initial state as progress.
 *
 * The subscription is taken in `load` rather than here: a requirement that ends
 * up deduplicated or already held is never loaded, and would otherwise leave a
 * subscription nobody holds the handle to.
 */
export function channelRequirement(channel: Channel, pk: number): Requirement {
  let subscription: ReturnType<Channel['subscribe']> | undefined
  return {
    key: `${channel.name}/${pk}`,
    async load(report) {
      const pending = (subscription = channel.subscribe(pk))
      pending.promise.onProgress(report)

      // Subscribed for whenever the connection turns up, but not waited for:
      // with the socket down this can only run out the subscribe timeout, and
      // holding the navigation for twenty seconds says nothing the view can't
      // say better once it reconnects.
      if (!socket.isOpen) {
        pending.promise.catch(() => {})
        return
      }

      try {
        await pending.promise
      } catch (e) {
        // A timeout is not a dead end - the channel resubscribes on reconnect,
        // and the view's own useChannel follows it in. Holding the navigation
        // for it would leave the user staring at the page they tried to leave.
        if (isSubscribeError(e) && e.status === ErrorStatus.Timeout)
          return console.warn(`Timed out subscribing to ${channel.name}/${pk}`)
        throw e
      }
    },
    release() {
      subscription?.leave()
      subscription = undefined
    }
  }
}

/**
 * `meta.load` factory subscribing to `channel` for the pk in a route param.
 *
 * @example
 * meta: { load: channelFromParam(agendaItemChannel, 'aid') }
 */
export default function channelFromParam(
  channel: Channel,
  param: string
): RequirementFactory {
  return (to) => {
    const pk = paramPk(to, param)
    if (!pk) return
    return channelRequirement(channel, pk)
  }
}
