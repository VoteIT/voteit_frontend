import { Poll } from '@/modules/polls/types'
import ContentType from '../ContentType'

import rules from './rules'
import workflowStates from './workflowStates'

export default new ContentType<Poll>({
  states: workflowStates,
  rules,
  channelName: 'poll',
  restEndpoint: 'polls/'
})
