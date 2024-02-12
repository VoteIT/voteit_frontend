/* eslint-disable camelcase */
import ContentType from '@/contentTypes/ContentType'
import { Proposal } from './types'
import { proposalStates } from './workflowStates'
import { ExtractTransition } from '@/contentTypes/types'

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

export const proposalType = new ContentType<
  Proposal,
  ExtractTransition<typeof proposalStates>
>({
  states: proposalStates,
  name: 'proposal',
  restEndpoint: 'proposals/'
})

export const proposalTextType = new ContentType<ProposalText>({
  name: 'text_document',
  restEndpoint: 'text-documents/'
})
