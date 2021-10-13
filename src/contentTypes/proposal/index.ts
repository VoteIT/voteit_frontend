import { Proposal } from '@/modules/proposals/types'
import ContentType from '../ContentType'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<Proposal>({
  states,
  rules,
  channelName: 'proposal',
  restEndpoint: 'proposals/'
})
