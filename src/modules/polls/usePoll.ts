import { computed, Ref } from 'vue'
import { pollMethods, pollResults } from './methods'

import { PollState } from './types'
import usePolls from './usePolls'
import { canChangePoll, canDeletePoll, canVote as _canVote } from './rules'
import useProposals from '../proposals/useProposals'
import { Proposal } from '../proposals/types'

const polls = usePolls()
const { getProposal } = useProposals()

export default function usePoll (pollRef: Ref<number>) {
  const poll = computed(() => polls.getPoll(pollRef.value))

  const pollStatus = computed(() => {
    if (!poll.value) return
    return polls.getPollStatus(poll.value.pk)
  })
  const nextUnvoted = computed(() => {
    if (!poll.value) return
    const next = polls.getNextUnvotedPoll(poll.value.meeting)
    if (!next || next.pk === poll.value.pk) return
    return next
  })

  const isOngoing = computed(() => poll.value?.state === PollState.Ongoing)
  const isFinished = computed(() => poll.value?.state === PollState.Finished)
  const userVote = computed(() => poll.value && polls.getUserVote(poll.value))

  const canChange = computed(() => poll.value && canChangePoll(poll.value))
  const canDelete = computed(() => poll.value && canDeletePoll(poll.value))
  const canVote = computed(() => poll.value && _canVote(poll.value))

  const voteComponent = computed(() => poll.value && pollMethods[poll.value.method_name])
  const resultComponent = computed(() => poll.value && pollResults[poll.value.method_name])

  const proposals = computed(() => {
    if (!poll.value) return []
    return poll.value.proposals
      .map(getProposal)
      .filter(p => p) as Proposal[]
  })
  const approved = computed(() => {
    if (!poll.value?.result) return []
    return poll.value.result.approved
      .map(getProposal)
      .filter(p => p) as Proposal[]
  })
  const denied = computed(() => {
    if (!poll.value?.result) return []
    return poll.value.result.denied
      .map(getProposal)
      .filter(p => p) as Proposal[]
  })

  return {
    approved,
    denied,
    canChange,
    canDelete,
    canVote,
    isOngoing,
    isFinished,
    poll,
    pollStatus,
    proposals,
    nextUnvoted,
    resultComponent,
    userVote,
    voteComponent
  }
}
