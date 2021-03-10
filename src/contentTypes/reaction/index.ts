/* eslint-disable camelcase */
import ContentType from '../ContentType'

export interface Reaction {
  pk: number
  content_type: string
  object_id: number
  button: number
  user: number
  agenda_item: number
}

export interface ReactionCountMessage {
  button: number
  content_type: string
  count: number
  object_id: number
}

export type ReactionRelation = Pick<Reaction, 'content_type' | 'object_id'>

export default new ContentType<Reaction>({
  channelName: 'reaction'
})
