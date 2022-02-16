import ContentType from '@/contentTypes/ContentType'

import { SpeakerHistory, SpeakerList, SpeakerSystem, SpeakerSystemRole } from './types'
import { speakerListStates, speakerSystemStates } from './workflowStates'

export const speakerSystemType = new ContentType<SpeakerSystem, SpeakerSystemRole>({
  name: 'speaker_system',
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

export const speakerType = new ContentType<object>({
  name: 'speaker'
})

export const speakerHistoryType = new ContentType<SpeakerHistory>({
  name: 'speaker_history',
  restEndpoint: 'speaker-history/'
})
