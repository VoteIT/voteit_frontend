import { RestApiConfig } from '@/composables/types'
import Channel from '../Channel'
import ContentAPI from '../ContentAPI'
import { ChannelConfig, Poll } from '../types'

import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'poll.poll',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => new Channel<Poll>('poll', config),
  useContentApi: (config?: RestApiConfig) => new ContentAPI<Poll>('polls/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
