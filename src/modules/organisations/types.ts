/* eslint-disable camelcase */
export enum OrganisationRole {
  Manager = 'org_manager',
  MeetingCreator = 'meeting_creator',
}

interface OrganisationComponent<Settings = null> {
  readonly component_name: string
  readonly is_valid: boolean
  readonly organisation: number
  readonly pk: number
  readonly settings: Settings
  readonly state: 'on' | 'off'
}

export interface Organisation {
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

export enum UserState {
  Incomplete = 'incomplete',
  Active = 'active'
}

export interface User {
  pk: number
  first_name: string
  full_name: string
  img_url: string | null
  last_name: string
  organisation: number
  organisation_roles: OrganisationRole[]
  state: UserState
  userid: string | null
  email: string
}
