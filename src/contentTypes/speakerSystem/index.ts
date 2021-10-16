/* eslint-disable camelcase */
import { SpeakerSystem } from '@/modules/speakerLists/types'
import { speakerSystemWorkflows } from '@/modules/speakerLists/workflowStates'
import ContentType from '../ContentType'

import rules from './rules'

export default new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemWorkflows,
  rules,
  hasRoles: true
})
