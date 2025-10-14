import { Component } from 'vue'
import { MeetingPlugin } from '../meetings/PluginHandler'
import { Author, Meeting } from '../meetings/types'

/* eslint-disable camelcase */
export enum ProposalState {
  Published = 'published',
  Retracted = 'retracted',
  Voting = 'voting',
  Approved = 'approved',
  Denied = 'denied',
  Unhandled = 'unhandled'
}

type BaseProposal = {
  pk: number
  title: string
  m: number // Meeting primary key
  name: string
  state: ProposalState
  agenda_item: number
  body: string
  created: string
  meeting_group: number | null
  modified: string
  prop_id: string
  shortname: string
  tags: string[]
} & Author

export type RichtextProposal = BaseProposal & {
  shortname: 'proposal'
}

export type DiffProposal = BaseProposal & {
  shortname: 'diff_proposal'
  body_diff_brief: string
  paragraph: number
}

export type Proposal = RichtextProposal | DiffProposal

export function isProposal(prop?: Proposal): prop is Proposal {
  return !!prop
}
export function isDiffProposal(prop: Proposal): prop is DiffProposal {
  return prop.shortname === 'diff_proposal'
}
export function isRichtextProposal(prop: Proposal): prop is RichtextProposal {
  return prop.shortname === 'proposal'
}

export type PreviewProposal = Omit<Proposal, 'created' | 'pk' | 'shortname'>

export type ProposalButtonMode = 'presentation' | 'vote' | 'voteTemplate'
export interface ProposalButtonPlugin extends MeetingPlugin {
  checkActive?(meeting: Meeting, mode?: ProposalButtonMode): boolean
  component: Component<{
    mode?: ProposalButtonMode
    proposal: Proposal
  }>
}
