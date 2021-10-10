/* eslint-disable camelcase */
import ContentType from '@/contentTypes/ContentType'

export interface TextParagraph {
  paragraph_id: number
  pk: number
  body: string
  tag: string
}

export interface TextDocument {
  created: Date
  modified: Date
  pk: number
  agenda_item: number
  paragraphs: TextParagraph[]
  body: string
  base_tag: string
}

export const textDocumentType = new ContentType<TextDocument>({
  channelName: 'text_document',
  restEndpoint: 'text-documents/',
  dateFields: ['created', 'modified']
})
