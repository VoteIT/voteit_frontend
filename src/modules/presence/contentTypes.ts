import ContentType from '@/contentTypes/ContentType'
import {
  ExtractTransition,
  Presence,
  PresenceCheck
} from '@/contentTypes/types'
import { presenceCheckStates } from './workflowStates'

export const presenceType = new ContentType<Presence>({
  name: 'presence',
  channels: ['presence'],
  useSocketApi: true
})

export const presenceCheckType = new ContentType<
  PresenceCheck,
  ExtractTransition<typeof presenceCheckStates>
>({
  name: 'presence_check',
  channels: ['presence_check'],
  restEndpoint: 'presence-checks/',
  states: presenceCheckStates
})
