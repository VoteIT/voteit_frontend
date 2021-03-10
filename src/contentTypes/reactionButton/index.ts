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

export default new ContentType<ReactionButton>({
  channelName: 'reaction_button'
})
