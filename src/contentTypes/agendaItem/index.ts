import { ChannelConfig, RestApiConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'agenda.agendaitem',
  rules,
  workflowStates,
  useChannels: (config?: ChannelConfig) => useChannels('agenda_item', config),
  useContentApi: (config?: RestApiConfig) => useContentApi('agenda-items/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
