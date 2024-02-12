import ContentType, { BaseContentType } from '@/contentTypes/ContentType'

import {
  SpeakerHistory,
  SpeakerList,
  Speaker,
  SpeakerSystem,
  SpeakerSystemRole
} from './types'
import { speakerListStates, speakerSystemStates } from './workflowStates'
import { ExtractTransition } from '@/contentTypes/types'

export const speakerSystemType = new ContentType<
  SpeakerSystem,
  ExtractTransition<typeof speakerSystemStates>,
  SpeakerSystemRole
>({
  name: 'speaker_system',
  channels: ['sls'],
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemStates,
  roles: {
    list_moderator: {
      translateHelp: (t) => t('role.help.list_moderator'),
      translateName: (t) => t('role.list_moderator')
    },
    speaker: {
      translateHelp: (t) => t('role.help.speaker'),
      translateName: (t) => t('role.speaker')
    }
  }
})

export const speakerListType = new ContentType<
  SpeakerList,
  ExtractTransition<typeof speakerListStates>
>({
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
