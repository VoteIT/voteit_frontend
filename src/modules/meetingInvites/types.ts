import type { IdentityAccountMeeting } from '../auth/types'
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

/**
 * The account that used an invite. Without a switch, userid is left out and
 * names are partly masked.
 */
export interface UsedByAccount {
  pk: number
  first_name: string
  last_name: string
  userid?: string | null
  last_login: string | null
  /** With a switch: the first few upcoming and ongoing meetings, of meeting_count */
  meetings?: IdentityAccountMeeting[]
  meeting_count?: number
}

export interface MeetingInvite {
  pk: number
  created?: string
  has_annotations: boolean
  user_data: {
    email?: string
    member_id?: string
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
  // From handle-matched-invites with include_used
  used_elsewhere?: boolean
  switch_to?: null | number
  used_by_account?: null | UsedByAccount
}
