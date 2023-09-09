import ContentType, { BaseContentType } from '@/contentTypes/ContentType'

import { SpeakerHistory, SpeakerList, Speaker, SpeakerSystem, SpeakerSystemRole } from './types'
import { speakerListStates, speakerSystemStates } from './workflowStates'

export const speakerSystemType = new ContentType<SpeakerSystem, SpeakerSystemRole>({
  name: 'speaker_system',
  channels: ['sls'],
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemStates,
  hasRoles: true
})

export const speakerListType = new ContentType<SpeakerList>({
  states: speakerListStates,
  name: 'speaker_list',
  channels: ['speaker_list'],
  restEndpoint: 'speaker-lists/'
})

export const speakerType = new ContentType<Speaker>({
  name: 'speaker',
  restEndpoint: 'speakers/'
})

export const speakerHistoryType = new BaseContentType<SpeakerHistory>({
  name: 'speaker_history',
  restEndpoint: 'speaker-history/'
})
