import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'agenda.agendaitem',
  rules,
  workflowStates,
  useChannels: config => useChannels('agenda_item', config),
  useContentApi: config => useContentApi('agenda-items/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
