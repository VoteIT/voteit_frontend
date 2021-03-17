/* eslint-disable camelcase */

import { PollMethodName, PollMethodSettings } from '@/components/pollmethods/types'
import { ChannelsConfig } from '@/utils/types'
import { PresenceCheckState } from './presenceCheck/workflowStates'

export enum MeetingRole {
  Participant = 'participant',
  Proposer = 'proposer',
  Discusser = 'discusser',
  PotentialVoter = 'potential_voter',
  Moderator = 'moderator'
}

export enum SpeakerSystemRole {
  Speaker = 'speaker',
  ListModerator = 'list_moderator'
}

export interface WorkflowState {
  state: string
  icon: string
  transition?: string
  name?: string
  requiresRole?: MeetingRole
  isFinal?: boolean
}

export interface BaseContent {
  pk: number
  title: string
}

export interface StateContent extends BaseContent {
  state: string
}

export interface Meeting extends StateContent {
  body: string
  current_user_roles?: MeetingRole[]
  end_time: string | Date
  public: boolean
  start_time: string | Date
}

export interface AgendaItem extends StateContent {
  meeting: number
  order: number
  body: string
}

export interface Proposal extends StateContent {
  agenda_item: number
  author: number
  body: string
  created: string | Date
  prop_id: string
  tags: string[]
}

export interface Poll extends StateContent {
  agenda_item: number
  meeting: number
  method_name: PollMethodName
  body: string | null
  electoral_register?: number
  initial_electoral_register?: number
  proposals: number[]
  result: object | null // TODO
  settings: PollMethodSettings | null
}

export interface PollStatus {
  pk: number
  voted: number
  total: number
}

export interface DiscussionPost {
  pk: number
  agenda_item: number
  author: number
  created: string | Date
  body: string
  tags: string[]
}

export interface SpeakerList extends StateContent {
  speaker_system: number
  agenda_item: number
}

export interface SpeakerOrderUpdate {
  pk: number // Speaker list
  queue: number[] // Current order
  current: number // Current speaker
}

export enum SpeakerSystemMethod {
  Simple = 'simple',
  Priority = 'priority',
}

export interface SpeakerSystem extends StateContent {
  active_list?: number
  meeting: number
  method_name: SpeakerSystemMethod
  safe_positions?: number
  settings: object // TODO
}

export interface PresenceCheck {
  pk: number
  meeting: number
  presence_system: number
  state: PresenceCheckState
  opened: string | Date
  closed: string | Date
}

export interface Presence {
  pk: number
  user: number
  presence_check: number
}

export interface ElectoralRegister {
  pk: number
  voters: number[]
}

export interface Vote {
  abstain: boolean
  vote: Object
}

export enum AccessPolicyType {
  Automatic = 'automatic',
  ModeratorApproved = 'moderator_approved'
}

export interface AccessPolicy {
  pk: number
  meeting: number
  active: boolean
  name: AccessPolicyType
  roles_given: string[]
}

export interface MeetingAccessPolicy {
  pk: number // Meeting id
  policies: AccessPolicy[]
}

export type AuthoredContent = DiscussionPost | Proposal

export enum SchemaType {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

export interface ChannelConfig extends ChannelsConfig {
  leaveDelay?: number
}

export type predicate = (obj: any) => boolean
