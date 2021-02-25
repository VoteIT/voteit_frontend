import { RestApiConfig } from '@/composables/types'
import Channel from '../Channel'
import ContentAPI from '../ContentAPI'
import { ChannelConfig, Proposal } from '../types'

import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'proposal.proposal',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => new Channel<Proposal>('proposal', config),
  useContentApi: (config?: RestApiConfig) => new ContentAPI<Proposal>('proposals/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
