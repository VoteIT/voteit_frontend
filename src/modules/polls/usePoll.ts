import { computed, Ref } from 'vue'

import { Poll, PollState } from './types'
import usePolls from './usePolls'

const polls = usePolls()

export default function usePoll (pollRef: Ref<Poll | number>) {
  const poll = computed(() => {
    if (typeof pollRef.value === 'number') return polls.getPoll(pollRef.value)
    return pollRef.value
  })

  const pollStatus = computed(() => {
    if (!poll.value) return
    return polls.getPollStatus(poll.value.pk)
  })

  const isOngoing = computed(() => poll.value?.state === PollState.Ongoing)

  return {
    isOngoing,
    poll,
    pollStatus
  }
}
