import ContentType, { BaseContentType } from '@/contentTypes/ContentType'
import defineChannel from '@/socket/defineChannel'
import { LastRead } from '@/utils/types'

import { AgendaItem, AgendaBody, AgendaState } from './types'

export const agendaItemChannel = defineChannel('agenda_item')

export const agendaItemType = new ContentType<
  AgendaItem,
  'make_upcoming' | 'make_ongoing' | 'close' | 'unpublish'
>({
  name: 'agenda_item',
  restEndpoint: 'agenda-items/',
  states: {
    name: 'AgendaItemStateMachine',
    meta: {
      [AgendaState.Private]: {
        icon: 'mdi-eye-off',
        priority: 4,
        translate: (t, count = 1) => t('agenda.workflow.private', count)
      },
      [AgendaState.Upcoming]: {
        icon: 'mdi-progress-clock',
        priority: 2,
        translate: (t, count = 1) => t('agenda.workflow.upcoming', count)
      },
      [AgendaState.Ongoing]: {
        icon: 'mdi-play-circle',
        priority: 1,
        translate: (t, count = 1) => t('agenda.workflow.ongoing', count)
      },
      [AgendaState.Closed]: {
        icon: 'mdi-check-all',
        priority: 3,
        translate: (t, count = 1) => t('agenda.workflow.closed', count)
      },
      [AgendaState.Archived]: {
        icon: 'mdi-archive',
        translate: (t, count = 1) => t('agenda.workflow.archived', count)
      }
    }
  }
})

export const lastReadType = new BaseContentType<LastRead>({
  name: 'last_read'
})

export const agendaBodyType = new ContentType<AgendaBody>({
  name: 'agenda_body'
})
