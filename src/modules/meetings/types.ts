import type { Component } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import type { BaseContent } from '@/contentTypes/types'
import type { voteManagementComponents } from './dialects/index'

export type BubbleComponent = Component & { id: string, icon: string, order: number }

export interface BubbleInfo {
  component: BubbleComponent
  data: Object
}

export interface BubbleConfig {
  open?: boolean
}

export interface BubbleActivation extends BubbleInfo {
  config: BubbleConfig
}

export enum MeetingRole {
  Participant = 'participant',
  Proposer = 'proposer',
  Discusser = 'discusser',
  PotentialVoter = 'potential_voter',
  Moderator = 'moderator'
}

export enum MeetingInviteState {
  Open = 'open',
  // PROCESSING = "processing"
  // FAILED = "failed"
  Expired = 'expired',
  Revoked = 'revoked',
  Accepted = 'accepted',
  Rejected = 'rejected'
}

export interface MeetingInvite {
  pk: number
  created_by: number
  invite_data: string
  meeting: number
  meeting_title: string
  organisation_pk: number
  roles: MeetingRole[]
  state: MeetingInviteState
  type: 'email' | 'swedish_ssn'
  used_by: null | number
}

export enum MeetingComponentState {
  On = 'on',
  Off = 'off'
}

export enum MeetingState {
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archiving = 'archiving',
  Archived = 'archived',
  Deleting = 'deleting'
}

export interface MeetingDialectDefinition {
  block_components?: string[]
  configure_components?: { name: string }[]
  description: string
  er_policy_name: string
  group_votes_active: boolean
  group_roles_active: boolean
  installable: boolean
  name: string
  roles: {
    can_discuss_as: boolean
    can_propose_as: boolean
    title: string
    role_id: string
    roles: MeetingRole[]
  }[]
  title: string,
  view_components: {
    votes_management: keyof typeof voteManagementComponents
  }
}

export interface Meeting extends BaseContent {
  state: MeetingState
  body: string
  current_user_roles?: MeetingRole[]
  dialect: MeetingDialectDefinition | null
  end_time: Date | null
  er_policy_name?: string
  group_votes_active: boolean
  group_roles_active: boolean
  public: boolean
  visible_in_lists: boolean
  start_time: Date | null
}

export interface MeetingGroup extends BaseContent {
  groupid: string
  body: string
  created: Date
  modified: Date
  tags: string[]
  author: number
  last_modified_by: number | null
  meeting: number
  mentions: number[]
  votes: null | number
}

export interface GroupRole extends BaseContent {
  roles: MeetingRole[]
  can_discuss_as: boolean
  can_propose_as: boolean
  role_id: string
  meeting: number
}

export interface GroupMembership {
  meeting_group: number
  pk: number
  role: null | number
  user: number
  votes: null | number
}

type UserAuthor = { author: number, meeting_group: null }
type GroupAuthor = { author: number | null, meeting_group: number }
export type Author = UserAuthor | GroupAuthor

export interface ComponentBase<N = string> {
  readonly pk: number
  state: 'on' | 'off'
  meeting: number
  component_name: N
  settings: unknown
}

export interface NoSettingsComponent<N = string> extends ComponentBase<N> {
  settings: null
}

type AnnotatedMeetingGroup = MeetingGroup & { memberships: GroupMembership[] }
type ColumnComponent = Component<{ group: AnnotatedMeetingGroup }>

export interface MeetingGroupColumn {
  // Add component eventually
  component?: ColumnComponent
  name: string
  getCount? (): number
  getDescription? (t: ComposerTranslation): string
  getTitle (t: ComposerTranslation): string
  getValue? (group: MeetingGroup & { memberships: GroupMembership[] }): string | number
}
