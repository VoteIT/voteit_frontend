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
  created: string
  modified: string
  pk: number
  agenda_item: number
  paragraphs: TextParagraph[]
  base_tag: string
}

export const proposalType = new ContentType<Proposal>({
  states: proposalStates,
  name: 'proposal',
  restEndpoint: 'proposals/',
  dateFields: ['created', 'modified']
})

export const proposalTextType = new ContentType<ProposalText>({
  name: 'text_document',
  restEndpoint: 'text-documents/',
  dateFields: ['created', 'modified']
})
