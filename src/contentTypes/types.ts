/* eslint-disable camelcase */

import { PollMethodName, PollMethodSettings } from '@/modules/polls/methods/types'
import { ChannelsConfig } from '@/utils/types'
import { PollState } from './poll/workflowStates'
import { PresenceCheckState } from './presenceCheck/workflowStates'
import { ProposalState } from './proposal/workflowStates'
import { SpeakerListState } from './speakerList/workflowStates'
import { UserState } from './user/workflowStates'

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

export interface AgendaItem extends StateContent {
  meeting: number
  readonly order: number
  body: string
  readonly related_modified: string | Date | null
  block_proposals: boolean
  block_discussion: boolean
}

export interface Proposal extends BaseContent {
  state: ProposalState
  agenda_item: number
  author: number
  body: string
  created: string | Date
  prop_id: string
  tags: string[]
}

export interface Poll extends BaseContent {
  state: PollState
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
  scope: string[]
}

export interface User {
  pk: number
  state: UserState
  userid: string | null
  full_name: string
  first_name: string
  last_name: string
  organisation: number
  organisation_roles: OrganizationRole[]
}
