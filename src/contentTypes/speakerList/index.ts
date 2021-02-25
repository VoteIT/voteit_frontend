import Channel from '../Channel'
import { ChannelConfig, SpeakerList } from '../types'
import useWorkflows from '../useWorkflows'

import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'speaker.speakerlist',
  workflowStates,
  rules,
  useChannels: (config?: ChannelConfig) => new Channel<SpeakerList>('speaker_list', config),
  useWorkflows: () => useWorkflows(workflowStates)
}
