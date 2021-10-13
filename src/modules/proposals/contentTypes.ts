/* eslint-disable camelcase */
import ContentType from '@/contentTypes/ContentType'

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

export const proposalTextType = new ContentType<ProposalText>({
  channelName: 'text_document',
  restEndpoint: 'text-documents/',
  dateFields: ['created', 'modified']
})
