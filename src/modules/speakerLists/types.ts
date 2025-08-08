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
  GenderPriority = 'gender_prio',
  Simple = 'simple',
  Priority = 'priority'
}

type SpeakerSystemSettings = { max_times: number } | null

export interface SpeakerSystem {
  pk: number
  state: SpeakerSystemState
  active_list: number | null
  meeting: number
  meeting_roles_to_speaker: MeetingRole[]
  method_name: SpeakerSystemMethod
  room: number
  safe_positions: number | null
  settings: SpeakerSystemSettings
  show_time: boolean // Display spoken time in real-time view
}

export type SpeakerSystemEditable = Pick<
  SpeakerSystem,
  | 'meeting_roles_to_speaker'
  | 'method_name'
  | 'safe_positions'
  | 'settings'
  | 'show_time'
>

export enum SpeakerListState {
  Open = 'open',
  Closed = 'closed'
}

export interface SpeakerList extends BaseContent {
  state: SpeakerListState
  readonly agenda_item: number
  readonly current: number
  readonly room: number
  readonly queue: number[]
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
  queue: QueuedSpeaker[] | CurrentSpeaker[]
}

export interface SpeakerListAddMessage {
  title: string
  speaker_system: number
  agenda_item: number
}

export interface Speaker {
  pk: number
  room: number
  speaker_list: number
  started: string | null
  user: number
  seconds: number | null
}

export interface QueuedSpeaker extends Speaker {
  started: null
  seconds: null
}

export interface CurrentSpeaker extends Speaker {
  started: string
  seconds: null
}

export interface HistoricSpeaker extends Speaker {
  started: string
  seconds: number
}

export function isQueuedSpeaker(speaker?: Speaker): speaker is QueuedSpeaker {
  return !!speaker && !speaker.seconds && !speaker.started
}

export function isCurrentSpeaker(speaker: Speaker): speaker is CurrentSpeaker {
  return !speaker.seconds && !!speaker.started
}

export function isHistoricSpeaker(
  speaker: Speaker
): speaker is HistoricSpeaker {
  return !!(speaker.seconds && speaker.started)
}
