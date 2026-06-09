import ContentType, { BaseContentType } from '@/contentTypes/ContentType'

import {
  SpeakerHistory,
  SpeakerList,
  Speaker,
  SpeakerSystem,
  SpeakerSystemRole,
  SpeakerSystemState
} from './types'

export const speakerSystemType = new ContentType<
  SpeakerSystem,
  'activate' | 'inactivate',
  SpeakerSystemRole
>({
  name: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states: {
    name: 'SpeakerSystemStateMachine',
    meta: {
      [SpeakerSystemState.Inactive]: {
        icon: 'mdi-eye-off',
        translate: (t, count = 1) => t('speaker.systemWorkflow.inactive', count)
      },
      [SpeakerSystemState.Active]: {
        icon: 'mdi-eye',
        translate: (t, count = 1) => t('speaker.systemWorkflow.active', count)
      },
      [SpeakerSystemState.Archived]: {
        icon: 'mdi-archive',
        translate: (t, count = 1) => t('speaker.systemWorkflow.archived', count)
      }
    }
  },
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
