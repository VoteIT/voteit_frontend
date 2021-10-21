/* eslint-disable camelcase */
import { BaseContent } from '@/contentTypes/types'
import { MeetingRole } from '../meetings/types'

export interface Reaction {
  pk: number
  content_type: string
  object_id: number
  button: number
  user: number
  agenda_item: number
}

interface ReactionMessage {
  button: number
  content_type: string
  object_id: number
}

export interface ReactionCountMessage extends ReactionMessage {
  count: number
}

export interface ReactionListMessage extends ReactionMessage {
  userids: number[]
}

export type ReactionRelation = Pick<Reaction, 'content_type' | 'object_id'>

export interface ReactionButton extends BaseContent {
  meeting: number
  icon: string
  color: string
  order: number
  change_roles: MeetingRole[]
  list_roles: MeetingRole[]
  active: boolean
  allowed_models: string[]
}

export enum ReactionIcon {
  ThumbUp = 'mdi-thumb-up',
  ThumbDown = 'mdi-thumb-down',
  Star = 'mdi-star',
  Heart = 'mdi-heart',
  Forum = 'mdi-forum',
  CheckMark = 'mdi-check',
  Cancel = 'mdi-cancel',
  Accessible = 'mdi-wheelchair-accessibility',
  Alert = 'mdi-alert',
  Attachment = 'mdi-attachment',
  Pencil = 'mdi-pencil',
  Currency = 'mdi-currency-eur',
}
