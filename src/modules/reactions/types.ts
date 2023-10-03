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
  users: number[]
}

export type ReactionRelation = Pick<Reaction, 'content_type' | 'object_id'>

export interface ReactionButton extends BaseContent {
  active: boolean
  allowed_models: string[]
  change_roles: MeetingRole[]
  color: string
  description?: string
  flag_mode: boolean
  icon: string
  list_roles: MeetingRole[]
  meeting: number
  on_presentation: boolean
  on_vote: boolean
  order: number
  target: null | number
  vote_template: boolean
}

export interface IFlagButton extends ReactionButton {
  flag_mode: true
  change_roles: never[]
  list_roles: never[]
  target: null
}

export function isFlagButton (btn: ReactionButton): btn is IFlagButton {
  return btn.flag_mode
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
