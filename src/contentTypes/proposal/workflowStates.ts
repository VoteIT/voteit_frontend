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
    state: ProposalState.Published
  },
  {
    transition: 'retract',
    icon: 'mdi-undo-variant',
    state: ProposalState.Retracted
  },
  {
    transition: 'lock_for_vote',
    icon: 'mdi-vote',
    state: ProposalState.Voting
  },
  {
    transition: 'approved',
    icon: 'mdi-check-circle-outline',
    state: ProposalState.Approved
  },
  {
    transition: 'denied',
    icon: 'mdi-close-circle-outline',
    state: ProposalState.Denied
  },
  {
    transition: 'unhandled',
    icon: 'mdi-help-circle-outline',
    state: ProposalState.Unhandled
  }
]
