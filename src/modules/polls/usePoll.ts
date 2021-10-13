import { computed, Ref } from 'vue'

import { Poll, PollState } from './types'
import usePolls from './usePolls'

const polls = usePolls()

export default function usePoll (pollRef: Ref<number>) {
  const poll = computed(() => polls.getPoll(pollRef.value))

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
