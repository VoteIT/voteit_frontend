/* eslint-disable camelcase */
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
  readonly active: boolean
  readonly pk: number
  readonly title: string
  body: string
  help_info: string
  page_title: string
  readonly providers: LoginProvider[]
  readonly components: OrganisationComponent[]
}

export interface IUser {
  pk: number
  first_name: string
  image: string | null
  img_url: string | null
  last_name: string
  userid: string | null
  email: string
}

// Only when loading authenticated user from /api/user
export interface IOrganisationUser extends IUser {
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
}
