/* eslint-disable camelcase */
import { MeetingRole } from '@/modules/meetings/types'
import ContentType from '../ContentType'
import { BaseContent } from '../types'

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

export default new ContentType<ReactionButton>({
  channelName: 'reaction_button',
  restEndpoint: 'reaction-buttons/'
})
