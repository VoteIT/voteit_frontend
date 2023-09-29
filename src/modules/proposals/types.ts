import { Component } from 'vue'
import { MeetingPlugin } from '../meetings/PluginHandler'
import { Meeting } from '../meetings/types'

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
  m: number // Meeting primary key
  name: string
  state: ProposalState
  agenda_item: number
  author: number | null
  body: string
  created: string
  meeting_group: number | null
  modified: string
  prop_id: string
  tags: string[]
}

export interface RichtextProposal extends BaseProposal {
  shortname: 'proposal'
}

export interface DiffProposal extends BaseProposal {
  shortname: 'diff_proposal'
  body_diff_brief: string
  paragraph: number
}

export type Proposal = RichtextProposal | DiffProposal
type PreviewOmitted = 'created' | 'author' | 'pk' | 'prop_id'
export type PreviewProposal = Omit<Proposal, PreviewOmitted>

export type ProposalButtonMode = 'presentation' | 'vote'
export interface ProposalButtonPlugin extends MeetingPlugin {
  checkActive? (meeting: Meeting, mode?: ProposalButtonMode): boolean,
  component: Component<{
    mode?: ProposalButtonMode,
    proposal: Proposal
  }>
}
