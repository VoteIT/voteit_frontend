import ContentType, { BaseContentType } from '@/contentTypes/ContentType'
import { LastRead } from '@/utils/types'
import { AgendaItem, AgendaBody } from './types'
import { agendaItemStates } from './workflowStates'

export const agendaItemType = new ContentType<AgendaItem>({
  states: agendaItemStates,
  name: 'agenda_item',
  channels: ['agenda_item'],
  restEndpoint: 'agenda-items/'
})

export const lastReadType = new BaseContentType<LastRead>({
  name: 'last_read',
  useSocketApi: true
})

export const agendaBodyType = new ContentType<AgendaBody>({
  name: 'agenda_body'
})
