import { Ref, computed } from 'vue'
import { anyPoll, filterPolls } from './usePolls'
import { Poll, PollState } from './types'

export default function useMeetingPolls(meeting: Ref<number>) {
  function isMeetingOngoing(poll: Poll) {
    return poll.meeting === meeting.value && poll.state === PollState.Ongoing
  }

  const meetingHasOngoingPoll = computed(() => anyPoll(isMeetingOngoing))
  const meetingOngoingPolls = computed(() => filterPolls(isMeetingOngoing))

  return {
    meetingHasOngoingPoll,
    meetingOngoingPolls
  }
}
