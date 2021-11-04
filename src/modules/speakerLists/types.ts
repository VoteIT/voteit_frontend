/* eslint-disable camelcase */

import { BaseContent } from '@/contentTypes/types'
import { MeetingRole } from '../meetings/types'

export enum SpeakerSystemState {
  Inactive = 'inactive',
  Active = 'active',
  Archived = 'archived'
}

export enum SpeakerSystemRole {
  Speaker = 'speaker',
  ListModerator = 'list_moderator'
}

export enum SpeakerSystemMethod {
  Simple = 'simple',
  Priority = 'priority',
}

export interface SpeakerSystem {
  pk: number
  title: string
  state: SpeakerSystemState
  active_list?: number
  meeting: number
  meeting_roles_to_speaker: MeetingRole[]
  method_name: SpeakerSystemMethod
  safe_positions?: number
  settings: object // TODO
}

export enum SpeakerListState {
  Open = 'open',
  Closed = 'closed',
}

export interface SpeakerList extends BaseContent {
  state: SpeakerListState
  readonly speaker_system: number
  readonly agenda_item: number
}

export interface SpeakerOrderUpdate {
  readonly pk: number // Speaker list
  queue: number[] // Current order
  current: number // Current speaker
}
