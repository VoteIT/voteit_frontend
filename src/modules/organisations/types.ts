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

export interface IOrganisation {
  readonly active: boolean
  readonly pk: number
  readonly title: string
  body: string
  help_info: string
  page_title: string
  readonly login_url: string | null
  readonly id_host: string | null
  readonly scope: string[]
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
}
