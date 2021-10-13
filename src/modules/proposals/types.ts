/* eslint-disable camelcase */
import { ProposalState } from '@/contentTypes/proposal/workflowStates'

interface BaseProposal {
  pk: number
  title: string
  name: string
  state: ProposalState
  agenda_item: number
  author: number
  body: string
  created: string | Date
  prop_id: string
  tags: string[]
}

export interface RichtextProposal extends BaseProposal {
  shortname: 'proposal'
}

export interface DiffProposal extends BaseProposal {
  shortname: 'diff_proposal'
  body_diff: string
  paragraph: number
}

export type Proposal = RichtextProposal | DiffProposal
