import ContentType, { BaseContentType } from '@/contentTypes/ContentType'
import { ExtractTransition } from '@/contentTypes/types'

import {
  SpeakerHistory,
  SpeakerList,
  Speaker,
  SpeakerSystem,
  SpeakerSystemRole
} from './types'
import { speakerSystemStates } from './workflowStates'

export const speakerSystemType = new ContentType<
  SpeakerSystem,
  ExtractTransition<typeof speakerSystemStates>,
  SpeakerSystemRole
>({
  name: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states: speakerSystemStates,
  roles: {
    endpoint: 'speaker-system-roles/',
    definitions: {
      list_moderator: {
        translateHelp: (t) => t('role.help.list_moderator'),
        translateName: (t) => t('role.list_moderator')
      },
      speaker: {
        translateHelp: (t) => t('role.help.speaker'),
        translateName: (t) => t('role.speaker')
      }
    }
  }
})

export const speakerListType = new ContentType<SpeakerList>({
  name: 'speaker_list',
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
