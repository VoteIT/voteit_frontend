import { ThemeColor } from '@/utils/types'
import { ProposalState } from './types'
import { WorkflowState } from '@/contentTypes/types'

export const DEFAULT_FILTER_STATES = [
  ProposalState.Published,
  ProposalState.Voting,
  ProposalState.Approved
]

export const proposalStates: WorkflowState<
  ProposalState,
  'publish' | 'retract' | 'lock_for_vote' | 'approved' | 'denied' | 'unhandled'
>[] = [
  {
    transition: 'publish',
    icon: 'mdi-eye',
    state: ProposalState.Published,
    color: ThemeColor.Primary,
    getName(t, count = 1) {
      return t('proposal.workflow.published', count)
    }
  },
  {
    transition: 'retract',
    icon: 'mdi-undo-variant',
    state: ProposalState.Retracted,
    color: ThemeColor.Secondary,
    getName(t, count = 1) {
      return t('proposal.workflow.retracted', count)
    }
  },
  {
    transition: 'lock_for_vote',
    icon: 'mdi-vote',
    state: ProposalState.Voting,
    color: ThemeColor.Info,
    getName(t, count = 1) {
      return t('proposal.workflow.voting', count)
    }
  },
  {
    transition: 'approved',
    icon: 'mdi-check-circle-outline',
    state: ProposalState.Approved,
    color: ThemeColor.Success,
    getName(t, count = 1) {
      return t('proposal.workflow.approved', count)
    }
  },
  {
    transition: 'denied',
    icon: 'mdi-close-circle-outline',
    state: ProposalState.Denied,
    color: ThemeColor.Warning,
    getName(t, count = 1) {
      return t('proposal.workflow.denied', count)
    }
  },
  {
    transition: 'unhandled',
    icon: 'mdi-help-circle-outline',
    state: ProposalState.Unhandled,
    color: ThemeColor.Secondary,
    getName(t, count = 1) {
      return t('proposal.workflow.unhandled', count)
    }
  }
]
