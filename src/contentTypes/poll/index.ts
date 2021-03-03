import ContentType from '../ContentType'
import { Poll } from '../types'

import rules from './rules'
import workflowStates from './workflowStates'

export default new ContentType<Poll>({
  states: workflowStates,
  rules,
  channelName: 'poll',
  restEndpoint: 'polls/'
})
