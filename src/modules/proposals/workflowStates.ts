import { ThemeColor } from '@/utils/types'
import { ProposalState } from './types'

export const DEFAULT_FILTER_STATES = [ProposalState.Published, ProposalState.Voting, ProposalState.Approved]

export const proposalStates = [
  {
    transition: 'publish',
    icon: 'mdi-eye',
    state: ProposalState.Published,
    color: ThemeColor.Primary
  },
  {
    transition: 'retract',
    icon: 'mdi-undo-variant',
    state: ProposalState.Retracted,
    color: ThemeColor.Secondary
  },
  {
    transition: 'lock_for_vote',
    icon: 'mdi-vote',
    state: ProposalState.Voting,
    color: ThemeColor.Info
  },
  {
    transition: 'approved',
    icon: 'mdi-check-circle-outline',
    state: ProposalState.Approved,
    color: ThemeColor.Success
  },
  {
    transition: 'denied',
    icon: 'mdi-close-circle-outline',
    state: ProposalState.Denied,
    color: ThemeColor.Warning
  },
  {
    transition: 'unhandled',
    icon: 'mdi-help-circle-outline',
    state: ProposalState.Unhandled,
    color: ThemeColor.Secondary
  }
]
