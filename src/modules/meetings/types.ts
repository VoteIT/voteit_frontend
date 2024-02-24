import type { Component } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import type { BaseContent } from '@/contentTypes/types'
import type { voteManagementComponents } from './dialects/index'

export type BubbleComponent = Component & {
  id: string
  icon: string
  order: number
}

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
  Participant = 'pa',
  Proposer = 'pr',
  Discusser = 'di',
  PotentialVoter = 'pv',
  Moderator = 'mo'
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
  created: string
  has_annotations: boolean
  user_data: {
    email?: string
    swedish_ssn?: string
  }
  meeting: number
  meeting_title: string
  modified: string
  organisation_pk: number
  roles: MeetingRole[]
  state: MeetingInviteState
  used_at: null | string
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
  Deleting = 'deleting',
  Previous = 'pre' // This is not really a state. It's here as a workaround, because WorkkflowStates if not implemented correctly.
}

export interface MeetingDialectDefinition {
  block_components?: string[]
  block_roles?: MeetingRole[]
  configure_components?: { name: string }[]
  description: string
  er_policy_name: string
  group_votes_active: boolean | null // null = dialect does not dictate
  group_roles_active: boolean | null
  groups_can_delegate: boolean // Only dialect can activate this
  name: string
  roles: {
    title: string
    role_id: string
    roles: MeetingRole[]
  }[]
  title: string
  view_components: {
    votes_management: keyof typeof voteManagementComponents
  }
}

export interface Meeting extends BaseContent {
  state: MeetingState
  body: string
  current_user_roles?: MeetingRole[]
  dialect: MeetingDialectDefinition | null
  end_time: string | null
  er_policy_name?: string
  group_votes_active: boolean
  group_roles_active: boolean
  public: boolean
  visible_in_lists: boolean
  start_time: string | null
}

export interface MeetingGroup extends BaseContent {
  body: string
  delegate_to: number | null
  groupid: string
  meeting: number
  post_as: boolean
  show_on_speaker: boolean
  tags: string[]
  votes: null | number
}

export interface GroupRole extends BaseContent {
  roles: MeetingRole[]
  role_id: string
  meeting: number
}

export interface GroupMembership {
  m: number // Meeting primary key
  meeting_group: number
  pk: number
  role: null | number
  user: number
  votes: null | number
}

type UserAuthor = { author: number; meeting_group: null }
type GroupAuthor = { author: number | null; meeting_group: number }
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
  getCount?(): number
  getDescription?(t: ComposerTranslation): string
  getTitle(t: ComposerTranslation): string
  getValue?(
    group: MeetingGroup & { memberships: GroupMembership[] }
  ): string | number
}
