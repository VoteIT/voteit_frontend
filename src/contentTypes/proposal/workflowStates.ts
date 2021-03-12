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
    icon: 'mdi-eye-off',
    state: ProposalState.Retracted
  },
  {
    transition: 'lock_for_vote',
    icon: 'mdi-vote',
    state: ProposalState.Voting
  },
  {
    transition: 'approved',
    icon: 'mdi-check',
    state: ProposalState.Approved
  },
  {
    transition: 'denied',
    icon: 'mdi-close',
    state: ProposalState.Denied
  },
  {
    transition: 'unhandled',
    icon: 'mdi-cancel',
    state: ProposalState.Unhandled
  }
]
