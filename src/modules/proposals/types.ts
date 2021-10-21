/* eslint-disable camelcase */
export enum ProposalState {
  Published = 'published',
  Retracted = 'retracted',
  Voting = 'voting',
  Approved = 'approved',
  Denied = 'denied',
  Unhandled = 'unhandled'
}

interface BaseProposal {
  pk: number
  title: string
  name: string
  state: ProposalState
  agenda_item: number
  author: number
  body: string
  created: Date
  prop_id: string
  tags: string[]
}

export interface RichtextProposal extends BaseProposal {
  shortname: 'proposal'
}

export interface DiffProposal extends BaseProposal {
  shortname: 'diff_proposal'
  body_diff: string
  body_diff_brief: string
  paragraph: number
}

export type Proposal = RichtextProposal | DiffProposal
