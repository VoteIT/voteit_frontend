import { sortBy } from 'lodash'
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { stripHTML } from '@/utils'
import { getUserRandomSortValue } from '@/composables/useAuthentication'
import useElectoralRegister from '../meetings/electoralRegisters/useElectoralRegister'
import { getProposals } from '../proposals/useProposals'
import type { Proposal } from '../proposals/types'

import {
  canChangePoll,
  canDeletePoll,
  canVote as _canVote,
  isPollVoter
} from './rules'
import { pollPlugins } from './registry'
import { PollState } from './types'
import usePolls from './usePolls'

const polls = usePolls()

export default function usePoll(pollRef: Ref<number | undefined>) {
  const { t } = useI18n()

  const poll = computed(() =>
    typeof pollRef.value === 'number' ? polls.getPoll(pollRef.value) : undefined
  )
  const { electoralRegister, erMethod, erMethodWeighted, totalWeight } =
    useElectoralRegister(computed(() => poll.value?.electoral_register))
  const voteCount = computed(() => {
    if (!poll.value) return {}
    const abstains = poll.value.abstain_count ?? 0
    const votes = poll.value.result?.vote_count ?? 0
    const voted = votes + abstains
    if (electoralRegister.value) {
      const total = totalWeight.value ?? 0
      return {
        abstains,
        percentage: Math.round((voted / total) * 100),
        text: erMethodWeighted.value
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

  const isFinished = computed(() => poll.value?.state === PollState.Finished)
  const isPrivateOrUpcoming = computed(
    () =>
      poll.value &&
      [PollState.Private, PollState.Upcoming].includes(poll.value.state)
  )
  const isOngoing = computed(() => poll.value?.state === PollState.Ongoing)
  const isWithheld = computed(() => poll.value?.state === PollState.Withheld)
  const userVote = computed(() => poll.value && polls.getUserVote(poll.value))

  const canChange = computed(() => poll.value && canChangePoll(poll.value))
  const canDelete = computed(() => poll.value && canDeletePoll(poll.value))
  const canVote = computed(() => poll.value && _canVote(poll.value))

  const pollPlugin = computed(
    () => poll.value && pollPlugins.getPlugin(poll.value.method_name)
  )
  const pollHelpText = computed(() => pollPlugin.value?.getHelp(t))
  const pollMethodName = computed(
    () => poll.value && pollPlugins.getName(poll.value.method_name, t)
  )
  const voteComponent = computed(() => pollPlugin.value?.voteComponent)
  const resultComponent = computed(() => pollPlugin.value?.resultComponent)

  /**
   * Get sorting value for proposal, based on poll settings
   */
  function getProposalSortValue(proposal: Proposal) {
    switch (poll.value?.p_ord) {
      case 'a':
        return stripHTML(proposal.body).toLocaleLowerCase()
      case 'r':
        return getUserRandomSortValue(proposal.pk)
      default:
        return proposal.created
    }
  }

  const proposals = computed(() => {
    if (!poll.value) return []
    return sortBy(getProposals(poll.value.proposals), getProposalSortValue)
  })
  const approved = computed(() => {
    if (!poll.value?.result) return []
    return getProposals(poll.value.result.approved)
  })
  const denied = computed(() => {
    if (!poll.value?.result) return []
    return getProposals(poll.value.result.denied)
  })

  return {
    approved,
    denied,
    electoralRegister,
    erMethod,
    canChange,
    canDelete,
    canVote,
    isFinished,
    isPrivateOrUpcoming,
    isOngoing,
    isPollVoter: computed(() => poll.value && isPollVoter(poll.value)),
    isWithheld,
    poll,
    pollHelpText,
    pollMethodName,
    pollStatus,
    proposals,
    nextUnvoted,
    resultComponent,
    userVote,
    voteComponent,
    voteCount
  }
}
