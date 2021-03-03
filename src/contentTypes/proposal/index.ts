import { RestApiConfig } from '@/composables/types'
import Channel from '../Channel'
import ContentType from '../ContentType'
import { Proposal } from '../types'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<Proposal>({
  states,
  rules,
  channelName: 'proposal',
  restEndpoint: 'proposals/'
})
