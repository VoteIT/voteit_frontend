import ContentType from '@/contentTypes/ContentType'
import { ParticipantNumber } from './types'

export const participantNumberType = new ContentType<ParticipantNumber>({
  name: 'pn'
})
