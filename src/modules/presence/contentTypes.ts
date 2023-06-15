import ContentType from '@/contentTypes/ContentType'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import { presenceCheckStates } from './workflowStates'

export const presenceType = new ContentType<Presence>({
  name: 'presence',
  channels: ['presence'],
  useSocketApi: true
})

export const presenceCheckType = new ContentType<PresenceCheck>({
  name: 'presence_check',
  channels: ['presence_check'],
  restEndpoint: 'presence-checks/',
  states: presenceCheckStates
})
