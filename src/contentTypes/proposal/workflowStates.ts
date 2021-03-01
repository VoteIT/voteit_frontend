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
    icon: 'visibility',
    state: ProposalState.Published
  },
  {
    transition: 'retract',
    icon: 'visibility_off',
    state: ProposalState.Retracted
  },
  {
    transition: 'lock_for_vote',
    icon: 'how_to_vote',
    state: ProposalState.Voting
  },
  {
    transition: 'approved',
    icon: 'check',
    state: ProposalState.Approved
  },
  {
    transition: 'denied',
    icon: 'close',
    state: ProposalState.Denied
  },
  {
    transition: 'unhandled',
    icon: 'block',
    state: ProposalState.Unhandled
  }
]
