import { meetingChannel } from './contentTypes'

/** Calls `fn` with the meeting pk whenever a meeting channel is left. */
export function onMeetingChannelLeave(fn: (pk: number) => void) {
  return meetingChannel.onLeave(({ pk }) => fn(pk))
}
