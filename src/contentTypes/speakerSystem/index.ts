import { RestApiConfig } from '@/composables/types'
import { SpeakerSystem } from '../types'

import rules from './rules'
import ContentType from '../ContentType'

export default new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  rules,
  hasRoles: true
})
