import { ThemeColor } from '@/utils/types'

export enum ProposalState {
  Published = 'published',
  Retracted = 'retracted',
  Voting = 'voting',
  Approved = 'approved',
  Denied = 'denied',
  Unhandled = 'unhandled'
}

export default [
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
