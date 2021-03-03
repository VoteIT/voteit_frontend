import { RestApiConfig } from '@/composables/types'
import ContentType from '../ContentType'
import { AgendaItem } from '../types'

import rules from './rules'
import states from './workflowStates'

export default new ContentType<AgendaItem>({
  rules,
  states,
  channelName: 'agenda_item',
  restEndpoint: 'agenda-items/'
})
