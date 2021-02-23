import { ChannelConfig } from '@/composables/types'
import useChannels from '@/composables/useChannels'

import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'speaker.speakerlist',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => useChannels('speaker_list', config),
  useWorkflows: () => useWorkflows(workflowStates)
}
