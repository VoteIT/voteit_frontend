/* eslint-disable camelcase */

export interface DiscussionPost {
  readonly pk: number
  readonly agenda_item: number
  readonly author: number
  readonly created: string | Date
  body: string
  tags: string[]
}
