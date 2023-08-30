/* eslint-disable camelcase */
import { MeetingRole } from '@/modules/meetings/types'
import { ChannelsConfig, ThemeColor } from '@/utils/types'
import { PresenceCheckState } from '../modules/presence/workflowStates'

export interface WorkflowState<S = string> {
  state: S
  icon: string
  transition?: string
  requiresRole?: MeetingRole
  isFinal?: boolean
  priority?: number // Determines order in navigation, i.e. ongoing first
  color?: ThemeColor
}

export interface TransitionCondition {
  name: string
  allowed: boolean // Condition met?
  title: string // Title or name, mostly meant for the developer
}

// Transitions from backend
export interface Transition {
  name: string
  permission: string
  source: string
  target: string
  title: string
  icon?: string
  conditions: TransitionCondition[]
  allowed: boolean // perm + conditions met?
  has_perm: boolean // Is the permission met?
}

export interface BaseContent {
  readonly pk: number
  title: string
}

export interface StateContent extends BaseContent {
  state: string
}

export interface PresenceCheck {
  pk: number
  meeting: number
  presence_system: number
  state: PresenceCheckState
  opened: string
  closed: string
}

export interface Presence {
  pk: number
  user: number
  presence_check: number
  created: string
}

export interface Vote {
  pk: Number
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

export enum SchemaType {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

// For Channel.ts
export interface ChannelConfig extends ChannelsConfig {
  leaveDelay?: number
}
