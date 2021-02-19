import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi.js'
import useWorkflows from '../useWorkflows.js'

import rules from './rules'
import workflowStates from './workflowStates.js'

export default {
  naturalKey: 'proposal.proposal',
  workflowStates,
  rules,
  useChannels: config => useChannels('proposal', config),
  useContentApi: config => useContentApi('proposals/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
