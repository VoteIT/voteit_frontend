import { Author } from '../meetings/types'

export type DiscussionPost = {
  readonly agenda_item: number
  readonly body: string
  readonly created: string
  readonly pk: number
  readonly tags: string[]
} & Author
