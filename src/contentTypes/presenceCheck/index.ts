import ContentType from '../ContentType'
import { PresenceCheck } from '../types'
import rules from './rules'
import states from './workflowStates'

export default new ContentType<PresenceCheck>({
  channelName: 'presence_check',
  restEndpoint: 'presence-checks/',
  states,
  rules
})
