import { RestApiConfig } from '@/composables/types'
import Channel from '../Channel'
import ContentAPI from '../ContentAPI'
import { ChannelConfig, Meeting } from '../types'

import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'meeting.meeting',
  rules,
  workflowStates,
  useChannels: (config?: ChannelConfig) => new Channel<Meeting>('meeting', config),
  useContentApi: (config?: RestApiConfig) => new ContentAPI<Meeting>('meetings/', workflowStates, config),
  useWorkflows: () => useWorkflows(workflowStates)
}
