import { Ref, computed } from 'vue'
import { anyPoll, getNextUnvotedPoll, filterPolls } from './usePolls'
import { Poll, PollState } from './types'

export default function useMeetingPolls(meeting: Ref<number>) {
  function isMeetingOngoing(poll: Poll) {
    return poll.meeting === meeting.value && poll.state === PollState.Ongoing
  }

  const firstUnvotedPoll = computed(() => getNextUnvotedPoll(meeting.value))
  const meetingHasOngoingPoll = computed(() => anyPoll(isMeetingOngoing))
  const meetingOngoingPolls = computed(() => filterPolls(isMeetingOngoing))
  const meetingHasPoll = computed(() =>
    anyPoll((p) => p.meeting === meeting.value)
  )

  return {
    firstUnvotedPoll,
    meetingHasOngoingPoll,
    meetingHasPoll,
    meetingOngoingPolls
  }
}
