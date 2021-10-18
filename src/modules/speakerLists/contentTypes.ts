import ContentType from '@/contentTypes/ContentType'

import { SpeakerList, SpeakerSystem } from './types'
import { speakerListStates, speakerSystemStates } from './workflowStates'

export const speakerSystemType = new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemStates,
  hasRoles: true
})

export const speakerListType = new ContentType<SpeakerList>({
  states: speakerListStates,
  channelName: 'speaker_list',
  restEndpoint: 'speaker-lists/'
})
