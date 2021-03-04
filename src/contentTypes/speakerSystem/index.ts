import { RestApiConfig } from '@/composables/types'
import { SpeakerSystem } from '../types'
import ContentType from '../ContentType'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states,
  rules,
  hasRoles: true
})
