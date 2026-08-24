import { moderatorChannel, participantChannel } from './contentTypes'

/**
 * Calls `fn` with the meeting pk whenever a meeting's channel is left.
 *
 * Only one of the role channels is ever subscribed at a time, so this fires
 * once per meeting left - but also when the user's role changes, since that
 * swaps one role channel for the other. The incoming subscription redelivers
 * the state, so acting on it again is harmless.
 */
export function onMeetingLeave(fn: (pk: number) => void) {
  const disposers = [participantChannel, moderatorChannel].map((channel) =>
    channel.onLeave(({ pk }) => fn(pk))
  )
  return () => disposers.forEach((dispose) => dispose())
}
