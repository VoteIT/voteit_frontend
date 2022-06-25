/* eslint-disable camelcase */
import { BaseContent } from '@/contentTypes/types'
import { Component } from 'vue'

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
  type: 'email'
  used_by: null | number
}

export enum MeetingState {
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archiving = 'archiving',
  Archived = 'archived'
}

export interface Meeting extends BaseContent {
  state: MeetingState
  body: string
  current_user_roles?: MeetingRole[]
  end_time: Date | null
  er_policy_name?: string
  public: boolean
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
  members: number[]
}

type UserAuthor = { author: number, meeting_group: null }
type GroupAuthor = { author: number | null, meeting_group: number }
export type Author = UserAuthor | GroupAuthor
