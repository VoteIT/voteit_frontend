import ContentType from '@/contentTypes/ContentType'
import { Reaction, ReactionButton } from './types'

export const reactionType = new ContentType<Reaction>({
  channelName: 'reaction'
})

export const reactionButtonType = new ContentType<ReactionButton>({
  channelName: 'reaction_button',
  restEndpoint: 'reaction-buttons/'
})
