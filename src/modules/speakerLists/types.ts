/* eslint-disable camelcase */

export enum SpeakerSystemState {
  Inactive = 'inactive',
  Active = 'active',
  Archived = 'archived'
}

export enum SpeakerSystemRole {
  Speaker = 'speaker',
  ListModerator = 'list_moderator'
}

export enum SpeakerSystemMethod {
  Simple = 'simple',
  Priority = 'priority',
}

export interface SpeakerSystem {
  pk: number
  title: string
  state: SpeakerSystemState
  active_list?: number
  meeting: number
  method_name: SpeakerSystemMethod
  safe_positions?: number
  settings: object // TODO
}
