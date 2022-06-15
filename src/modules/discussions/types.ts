/* eslint-disable camelcase */

export interface DiscussionPost {
  readonly pk: number
  readonly agenda_item: number
  readonly author: number | null
  readonly created: string | Date
  readonly body: string
  readonly meeting_group: number | null
  readonly tags: string[]
}
