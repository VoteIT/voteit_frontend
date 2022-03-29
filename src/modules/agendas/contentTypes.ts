import ContentType from '@/contentTypes/ContentType'
import { LastRead } from '@/utils/types'
import { AgendaItem } from './types'
import { agendaItemStates } from './workflowStates'

export const agendaItemType = new ContentType<AgendaItem>({
  states: agendaItemStates,
  name: 'agenda_item',
  channels: ['agenda_item'],
  restEndpoint: 'agenda-items/',
  dateFields: ['related_modified']
})

export const lastReadType = new ContentType<LastRead>({
  name: 'last_read',
  useSocketApi: true
})
