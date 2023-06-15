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

// TODO This needs to be synced with variants of backend serializers
// Meeting user data can be based on this and be defined in ../meetings/types.ts
export interface User {
  pk: number
  first_name: string
  img_url: string | null
  last_name: string
  organisation: number // Only for authenticated user
  organisation_roles: OrganisationRole[] // Only when loading authenticated user from /api/user
  userid: string | null
  email: string
}
