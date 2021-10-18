import ContentType from '@/contentTypes/ContentType'
import { AgendaItem } from './types'
import { agendaItemStates } from './workflowStates'

export const agendaItemType = new ContentType<AgendaItem>({
  states: agendaItemStates,
  channelName: 'agenda_item',
  restEndpoint: 'agenda-items/'
})
