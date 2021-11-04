/* eslint-disable camelcase */
export enum OrganisationRole {
  Manager = 'org_manager',
  MeetingCreator = 'meeting_creator',
}

export interface Organisation {
  pk: number
  title: string
  body: string
  login_url: string | null
  id_host: string | null
  scopes: string[]
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
}
