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

type SpeakerSystemSettings = { max_times: number } | null

export interface SpeakerSystem {
  pk: number
  title: string
  state: SpeakerSystemState
  active_list?: number
  meeting: number
  meeting_roles_to_speaker: MeetingRole[]
  method_name: SpeakerSystemMethod
  safe_positions?: number
  settings?: SpeakerSystemSettings
}

export enum SpeakerListState {
  Open = 'open',
  Closed = 'closed',
}

export interface SpeakerList extends BaseContent {
  state: SpeakerListState
  readonly speaker_system: number
  readonly agenda_item: number
  readonly queue: number[]
  readonly current: number | null
}

// Historical speaker data, for a meeting or speaker_system
export interface SpeakerHistory {
  user: number
  times_spoken: number
  seconds_spoken: number
}

export interface SpeakerGroup {
  active?: boolean
  title?: string
  queue: number[]
}

export interface SpeakerListAddMessage {
  title: string
  speaker_system: number
  agenda_item: number
}

export interface QueuedSpeaker {
  pk: number
  speaker_list: number
  started: Date
  user: number
  seconds: null
}

export interface CurrentSpeaker {
  pk: number
  speaker_list: number
  started: null
  user: number
  seconds: null
}

export interface HistoricSpeaker {
  pk: number
  speaker_list: number
  started: Date
  user: number
  seconds: number
}

export type Speaker = QueuedSpeaker | CurrentSpeaker | HistoricSpeaker
