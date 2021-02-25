import { RestApiConfig } from '@/composables/types'
import Channel from '../Channel'
import ContentAPI from '../ContentAPI'
import { AgendaItem, ChannelConfig } from '../types'

import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'agenda.agendaitem',
  rules,
  workflowStates,
  useChannels: (config?: ChannelConfig) => new Channel<AgendaItem>('agenda_item', config),
  useContentApi: (config?: RestApiConfig) => new ContentAPI<AgendaItem>('agenda-items/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
