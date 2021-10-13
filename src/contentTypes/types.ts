/* eslint-disable camelcase */

import { MeetingRole } from '@/modules/meetings/types'
import { Proposal } from '@/modules/proposals/types'
import { ChannelsConfig } from '@/utils/types'
import { PresenceCheckState } from './presenceCheck/workflowStates'
import { SpeakerListState } from './speakerList/workflowStates'
import { UserState } from './user/workflowStates'

export enum SpeakerSystemRole {
  Speaker = 'speaker',
  ListModerator = 'list_moderator'
}

export interface WorkflowState {
  state: string
  icon: string
  transition?: string
  requiresRole?: MeetingRole
  isFinal?: boolean
  priority?: number // Determines order in navigation, i.e. ongoing first
}

// Transitions from backend
export interface Transition {
  name: string
  permission: string
  source: string
  target: string
  title: string,
  icon?: string
}

export interface BaseContent {
  readonly pk: number
  title: string
}

export interface StateContent extends BaseContent {
  state: string
}

export interface Meeting extends StateContent {
  body: string
  current_user_roles?: MeetingRole[]
  end_time: string | Date
  er_policy_name?: string
  public: boolean
  start_time: string | Date
}

export interface DiscussionPost {
  readonly pk: number
  readonly agenda_item: number
  readonly author: number
  readonly created: string | Date
  body: string
  tags: string[]
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
  vote: object
  poll: number
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

// For Channel.ts
export interface ChannelConfig extends ChannelsConfig {
  leaveDelay?: number
}

export type Predicate = (obj: any) => boolean

export enum OrganizationRole {
  Manager = 'org_manager',
  MeetingCreator = 'meeting_creator',
}

export interface Organization {
  pk: number
  title: string
  body: string
  login_url: string | null
  scopes: string[]
}

export interface User {
  pk: number
  first_name: string
  full_name: string
  img_url: string | null
  last_name: string
  organisation: number
  organisation_roles: OrganizationRole[]
  state: UserState
  userid: string | null
}
