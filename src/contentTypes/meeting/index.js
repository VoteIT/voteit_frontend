import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'meeting.meeting',
  rules,
  workflowStates,
  useChannels: config => useChannels('meeting', config),
  useContentApi: config => useContentApi('meetings/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
