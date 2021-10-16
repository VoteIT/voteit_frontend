import ContentType from '@/contentTypes/ContentType'
import { WorkflowState } from '@/contentTypes/types'
import rules from '@/contentTypes/speakerSystem/rules'

import { SpeakerSystem, SpeakerSystemState } from './types'

const speakerSystemWorkflows: WorkflowState[] = [
  {
    transition: 'inactivate',
    icon: 'mdi-eye-off',
    state: SpeakerSystemState.Inactive
  },
  {
    transition: 'activate',
    icon: 'mdi-eye',
    state: SpeakerSystemState.Active
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: SpeakerSystemState.Archived
  }
]

export const speakerSystemType = new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemWorkflows,
  rules,
  hasRoles: true
})
