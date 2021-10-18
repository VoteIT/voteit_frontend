import ContentType from '@/contentTypes/ContentType'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import { presenceCheckStates } from './workflowStates'

export const presenceType = new ContentType<Presence>({
  channelName: 'presence'
})

export const presenceCheckType = new ContentType<PresenceCheck>({
  channelName: 'presence_check',
  restEndpoint: 'presence-checks/',
  states: presenceCheckStates,
  dateFields: ['opened', 'closed']
})
