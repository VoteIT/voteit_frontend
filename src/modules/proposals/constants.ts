import { ProposalState } from './types'

export const UNRESOLVED_STATES = [
  ProposalState.Published,
  ProposalState.Voting
] as Readonly<ProposalState[]>

export const PROPOSAL_STATE_ORDER = [
  ProposalState.Approved,
  ProposalState.Denied,
  ProposalState.Voting,
  ProposalState.Published,
  ProposalState.Unhandled,
  ProposalState.Retracted
] as const
