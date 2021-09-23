/* eslint-disable camelcase */
export interface BubbleComponent {
  name: string
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
  data: Record<string, string>
  matched: null | Record<string, string>[] // Set when accepted or rejected. Should probably never be available.
  meeting: number
  meeting_title: string
  organisation_pk: number
  roles: MeetingRole[]
  state: MeetingInviteState
  used_by: null | number
}
