import { Component } from 'vue'
import { MeetingPlugin } from '../meetings/PluginHandler'

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

export interface ProposalButtonPlugin extends MeetingPlugin {
  component: Component<{ proposal: Proposal }>
}
