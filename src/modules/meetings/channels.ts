import { getSubscribedChannels } from '@/socket/defineChannel'

import { moderatorChannel, participantChannel } from './contentTypes'

const roleChannels = [participantChannel, moderatorChannel]
const roleChannelNames = new Set(roleChannels.map((channel) => channel.name))

/**
 * Calls `fn` with the meeting pk once the user is on neither role channel for
 * it any more.
 *
 * A role change is not a leave: it swaps one role channel for the other, and
 * the new one is subscribed before the old one is left. So a channel left
 * while the other is still subscribed for the same meeting is ignored.
 */
export function onMeetingLeave(fn: (pk: number) => void) {
  const disposers = roleChannels.map((channel) =>
    channel.onLeave(({ pk }) => {
      for (const ref of getSubscribedChannels())
        if (ref.pk === pk && roleChannelNames.has(ref.channel_type)) return
      fn(pk)
    })
  )
  return () => disposers.forEach((dispose) => dispose())
}
