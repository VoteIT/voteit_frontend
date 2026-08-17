import { channelLeftEvent } from '@/composables/events'

/** Calls `fn` with the meeting pk whenever a meeting channel is left. */
export function onMeetingChannelLeave(fn: (pk: number) => void) {
  return channelLeftEvent.on(({ channelType, pk }) => {
    if (channelType === 'meeting') fn(pk)
  })
}
