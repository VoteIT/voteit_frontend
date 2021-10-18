/* eslint-disable camelcase */
import ContentType from '@/contentTypes/ContentType'
import { Proposal } from './types'
import { proposalStates } from './workflowStates'

export interface TextParagraph {
  paragraph_id: number
  pk: number
  body: string
  tag: string
}

export interface ProposalText {
  title: string
  body: string
  created: Date
  modified: Date
  pk: number
  agenda_item: number
  paragraphs: TextParagraph[]
  base_tag: string
}

export const proposalType = new ContentType<Proposal>({
  states: proposalStates,
  channelName: 'proposal',
  restEndpoint: 'proposals/',
  dateFields: ['created']
})

export const proposalTextType = new ContentType<ProposalText>({
  channelName: 'text_document',
  restEndpoint: 'text-documents/',
  dateFields: ['created', 'modified']
})
