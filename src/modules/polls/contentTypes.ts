import ContentType from '@/contentTypes/ContentType'
import { Vote } from '@/contentTypes/types'
import { Poll } from './types'
import { pollStates } from './workflowStates'

export const pollType = new ContentType<Poll>({
  states: pollStates,
  name: 'poll',
  channels: ['poll'],
  restEndpoint: 'polls/'
})

export const voteType = new ContentType<Vote>({
  name: 'vote'
})
