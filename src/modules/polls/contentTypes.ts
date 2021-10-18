import ContentType from '@/contentTypes/ContentType'
import { Poll } from './types'
import { pollStates } from './workflowStates'

export const pollType = new ContentType<Poll>({
  states: pollStates,
  channelName: 'poll',
  restEndpoint: 'polls/',
  dateFields: ['started', 'closed']
})
