import { computed, Ref } from 'vue'
import { pollMethods, pollResults } from './methods'

import { PollState } from './types'
import usePolls from './usePolls'
import { canChangePoll, canDeletePoll, canVote as _canVote } from './rules'
import useProposals from '../proposals/useProposals'
import { Proposal } from '../proposals/types'
import useElectoralRegisters from '../meetings/electoralRegisters/useElectoralRegisters'
import { useI18n } from 'vue-i18n'

const polls = usePolls()
const { getRegister } = useElectoralRegisters()
const { getProposal } = useProposals()

export default function usePoll (pollRef: Ref<number>) {
  const { t } = useI18n()

  const poll = computed(() => polls.getPoll(pollRef.value))
  const electoralRegister = computed(() => {
    if (typeof poll.value?.electoral_register !== 'number') return null
    return getRegister(poll.value.electoral_register)
  })
  const voteCount = computed(() => {
    if (!poll.value) return {}
    const abstains = poll.value.abstain_count ?? 0
    const votes = poll.value.result?.vote_count ?? 0
    const voted = votes + abstains
    if (electoralRegister.value) {
      const total = electoralRegister.value.weights.length
      return {
        abstains,
        percentage: Math.round(voted / total * 100),
        text: t('poll.finalVoteCount', { abstains, votes, total }),
        voted,
        votes,
        total
      }
    }
    return {
      abstains,
      text: t('poll.finalVoteCountNoEr', { abstains, votes }),
      voted,
      votes
  }
  })

  const pollStatus = computed(() => {
    if (!poll.value) return
    return polls.getPollStatus(poll.value.pk)
  })
  const nextUnvoted = computed(() => {
    if (!poll.value) return
    const next = polls.getNextUnvotedPoll(poll.value.meeting, poll.value)
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
    electoralRegister,
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
    voteComponent,
    voteCount
  }
}
