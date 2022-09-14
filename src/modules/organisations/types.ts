/* eslint-disable camelcase */
export enum OrganisationRole {
  Manager = 'org_manager',
  MeetingCreator = 'meeting_creator',
}

export interface Organisation {
  readonly pk: number
  readonly title: string
  page_title: string
  body: string
  readonly login_url: string | null
  readonly id_host: string | null
  readonly scope: string[]
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
