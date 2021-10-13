import { computed, Ref } from 'vue'
import { pollMethods, pollResults } from './methods'

import { PollState } from './types'
import usePolls from './usePolls'

const polls = usePolls()

export default function usePoll (pollRef: Ref<number>) {
  const poll = computed(() => polls.getPoll(pollRef.value))

  const pollStatus = computed(() => {
    if (!poll.value) return
    return polls.getPollStatus(poll.value.pk)
  })

  const isOngoing = computed(() => poll.value?.state === PollState.Ongoing)
  const isFinished = computed(() => poll.value?.state === PollState.Finished)
  const userVote = computed(() => poll.value && polls.getUserVote(poll.value))

  const voteComponent = computed(() => poll.value && pollMethods[poll.value.method_name])
  const resultComponent = computed(() => poll.value && pollResults[poll.value.method_name])

  return {
    isOngoing,
    isFinished,
    poll,
    pollStatus,
    resultComponent,
    userVote,
    voteComponent
  }
}
