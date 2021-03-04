import Channel from '../Channel'
import ContentType from '../ContentType'
import { SpeakerList } from '../types'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<SpeakerList>({
  states,
  rules,
  channelName: 'speaker_list',
  restEndpoint: 'speaker-lists/'
})
