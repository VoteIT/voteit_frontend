import { ChannelConfig, RestApiConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'proposal.proposal',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => useChannels('proposal', config),
  useContentApi: (config?: RestApiConfig) => useContentApi('proposals/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
