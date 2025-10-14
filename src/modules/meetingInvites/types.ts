import { MeetingRole } from '../meetings/types'

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
  created?: string
  has_annotations: boolean
  user_data: {
    email?: string
    swedish_ssn?: string
  }
  meeting: number
  meeting_title?: string
  modified?: string
  organisation_pk: number
  roles: MeetingRole[]
  state: MeetingInviteState
  used_at?: null | string
  used_by: null | number
}
