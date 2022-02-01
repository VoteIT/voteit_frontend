import ContentType from '@/contentTypes/ContentType'
import { Reaction, ReactionButton } from './types'

export const reactionType = new ContentType<Reaction>({
  name: 'reaction',
  channels: ['reaction'],
  useSocketApi: true
})

export const reactionButtonType = new ContentType<ReactionButton>({
  name: 'reaction_button',
  restEndpoint: 'reaction-buttons/',
  useSocketApi: true
})
