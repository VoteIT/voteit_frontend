import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '../proposals/useProposals'
import useElectoralRegister from '../meetings/electoralRegisters/useElectoralRegister'
import { canChangePoll, canDeletePoll, canVote as _canVote, isPollVoter } from './rules'
// import { pollMethods, pollResults } from './methods'
import usePolls from './usePolls'
import { PollState } from './types'

import type { Proposal } from '../proposals/types'
import { pollPlugins } from './registry'

const polls = usePolls()
const { getProposal } = useProposals()

export default function usePoll (pollRef: Ref<number>) {
  const { t } = useI18n()

  const poll = computed(() => polls.getPoll(pollRef.value))
  const { electoralRegister, erMethod, isWeighted, totalWeight } = useElectoralRegister(computed(() => poll.value?.electoral_register))
  const voteCount = computed(() => {
    if (!poll.value) return {}
    const abstains = poll.value.abstain_count ?? 0
    const votes = poll.value.result?.vote_count ?? 0
    const voted = votes + abstains
    if (electoralRegister.value) {
      const total = totalWeight.value ?? 0
      return {
        abstains,
        percentage: Math.round(voted / total * 100),
        text: isWeighted
          ? t('poll.finalVoteCountWeighted', { abstains, votes, total })
          : t('poll.finalVoteCount', { abstains, votes, total }),
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

  const pollPlugin = computed(() => poll.value && pollPlugins.getPlugin(poll.value.method_name))
  const voteComponent = computed(() => pollPlugin.value?.voteComponent)
  const resultComponent = computed(() => pollPlugin.value?.resultComponent)

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
    erMethod,
    canChange,
    canDelete,
    canVote,
    isOngoing,
    isFinished,
    isPollVoter: computed(() => poll.value && isPollVoter(poll.value)),
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
