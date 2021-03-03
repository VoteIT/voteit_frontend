import ContentType from '../ContentType'
import { Meeting } from '../types'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<Meeting>({
  rules,
  states,
  channelName: 'meeting',
  restEndpoint: 'meetings/',
  hasRoles: true
})
