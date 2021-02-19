import useChannels from '@/composables/useChannels.js'

import useWorkflows from '../useWorkflows.js'

import rules from './rules'
import workflowStates from './workflowStates.js'

export default {
  naturalKey: 'speaker.speakerlist',
  workflowStates,
  rules,
  useChannels: config => useChannels('speaker_list', config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
