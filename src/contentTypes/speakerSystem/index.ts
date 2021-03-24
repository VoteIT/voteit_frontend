/* eslint-disable camelcase */
import { BaseContent } from '../types'
import ContentType from '../ContentType'

import rules from './rules'
import states, { SpeakerSystemState } from './workflowStates'

export enum SpeakerSystemMethod {
  Simple = 'simple',
  Priority = 'priority',
}

export interface SpeakerSystem extends BaseContent {
  state: SpeakerSystemState
  active_list?: number
  meeting: number
  method_name: SpeakerSystemMethod
  safe_positions?: number
  settings: object // TODO
}

export default new ContentType<SpeakerSystem>({
  channelName: 'speaker_system',
  restEndpoint: 'speaker-list-systems/',
  states,
  rules,
  hasRoles: true
})
