import { ChannelConfig, RestApiConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'poll.poll',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => useChannels('poll', config),
  useContentApi: (config?: RestApiConfig) => useContentApi('polls/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
