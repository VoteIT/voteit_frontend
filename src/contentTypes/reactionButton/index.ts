/* eslint-disable camelcase */
import ContentType from '../ContentType'
import { BaseContent, MeetingRole } from '../types'

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
  CheckMark = 'mdi-check',
  Cancel = 'mdi-cancel',
  Star = 'mdi-star',
  Accessible = 'mdi-wheelchair-accessibility',
}

export default new ContentType<ReactionButton>({
  channelName: 'reaction_button',
  restEndpoint: 'reaction-buttons/'
})
