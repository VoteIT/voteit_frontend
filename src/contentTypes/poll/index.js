import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi.js'
import useWorkflows from '../useWorkflows.js'

import rules from './rules'
import workflowStates from './workflowStates.js'

export default {
  naturalKey: 'poll.poll',
  workflowStates,
  rules,
  useChannels: config => useChannels('poll', config),
  useContentApi: config => useContentApi('polls/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
