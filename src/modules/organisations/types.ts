import type { RGB } from '@/utils/color'
import type { MeetingRole, MeetingState } from '../meetings/types'

export enum OrganisationRole {
  Manager = 'org_manager',
  MeetingCreator = 'meeting_creator'
}

interface OrganisationComponent<Settings = null> {
  readonly component_name: string
  readonly is_valid: boolean
  readonly organisation: number
  readonly pk: number
  readonly settings: Settings
  readonly state: 'on' | 'off'
}

/**
 * One way of signing in to an organisation.
 *
 * The backend orders these: the primary first, then by title. `profile_url`
 * and `logout_url` are the provider's own pages, and not every provider has
 * them.
 */
export interface LoginProvider {
  readonly provider_id: string
  readonly title: string
  readonly login_url: string
  readonly profile_url: string | null
  readonly logout_url: string | null
  readonly scope: string[]
}

export interface IOrganisation {
  body: string
  colors: {
    appBar?: RGB
  }
  help_info: string
  logo: string | null
  page_title: string
  readonly active: boolean
  readonly components: OrganisationComponent[]
  readonly pk: number
  readonly providers: LoginProvider[]
  readonly title: string
}

export interface IUser {
  pk: number
  first_name: string
  image: string | null
  img_url: string | null
  last_name: string
  userid: string | null
  /** Left out of user lists unless the viewer moderates the meeting. */
  email?: string
}

// Only when loading authenticated user from /api/user
export interface IOrganisationUser extends IUser {
  email: string
  organisation: number
  organisation_roles: OrganisationRole[]
  /**
   * Which login method opened this session, or null when it came from none we
   * offer. A property of the session, not the account: an account may hold
   * several credentials and only one of them was used.
   */
  login_provider: string | null
  /** Membership numbers tied to this account. Only ever sent for yourself. */
  member_ids: string[] | null
  /** When the user asked to have their account removed, or null. */
  removal_requested: string | null
}

/**
 * A version of the organisation's terms of service. Users accept the global
 * terms together with the organisation's addition in `body`.
 */
export interface TermsOfService {
  readonly pk: number
  /** The organisation's addition to the global terms. May be empty. */
  readonly body: string
  readonly organisation: number
  /** ISO datetime when it takes effect. May be in the future. */
  readonly version: string
}

/** A version of the terms of service that apply to every organisation. */
export interface GlobalTermsOfService {
  readonly pk: number
  readonly body: string
  /** ISO datetime of this version */
  readonly version: string
  /** ISO date users must have accepted it by, or null if not yet decided. */
  readonly required_from: string | null
  /** Why it changed from the previous version. */
  readonly notes: string
}

/**
 * What a user accepts: the global terms and the organisation's, either of
 * which may be missing.
 */
export interface CurrentTermsOfService {
  readonly global_tos: GlobalTermsOfService | null
  readonly organisation_tos: TermsOfService | null
  /** ISO datetime of the newest of the two, sent back on accept. Null when there are no terms. */
  readonly version: string | null
  /** ISO datetime when the user last accepted. Always null when anonymous. */
  readonly accepted: string | null
  /** Whether the user has terms in effect they haven't accepted. */
  readonly must_accept: boolean
  /** Whether there is a newer global tos that require the local tos to be updates, for org admins. */
  readonly newer_global_tos: boolean
}

/** What removing a user would affect, least to most in need of care. */
export enum RemovalClassification {
  NoActivity = 'no_activity',
  InactiveMeetings = 'inactive_meetings',
  ActiveMeeting = 'active_meeting',
  OngoingPoll = 'ongoing_poll',
  OrganisationRoles = 'organisation_roles'
}

/** A meeting a user who asked to be removed is connected to. */
export interface MeetingInvolvement {
  readonly pk: number
  readonly title: string
  readonly state: MeetingState
  readonly roles: MeetingRole[]
  readonly used_invite: boolean
  /** Titles of the user's meeting groups */
  readonly groups: string[]
  /** Ongoing polls where the user is in the electoral register */
  readonly ongoing_polls: number
  readonly votes: number
  readonly speaker_entries: number
  readonly proposals: number
  readonly discussion_posts: number
  /** Given or received */
  readonly vote_transfers: number
  readonly reactions: number
}

/** A user in the organisation who asked to be removed, for org managers. */
export interface RemovalRequest {
  readonly user: IUser
  readonly removal_requested: string // ISO date
  /** Before this, the user may still abort the request */
  readonly removable_after: string // ISO date
  /** The wait has passed, and it isn't the manager's own account */
  readonly can_remove: boolean
  readonly organisation_roles: OrganisationRole[]
  readonly classification: RemovalClassification
  readonly meetings: MeetingInvolvement[]
}
