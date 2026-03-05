import ContentType from '@/contentTypes/ContentType'
import { IProposalNote } from './types'

export const noteType = new ContentType<IProposalNote>({
  name: 'note',
  restEndpoint: 'notes/',
  restConfig: { alertOnError: false }
})
