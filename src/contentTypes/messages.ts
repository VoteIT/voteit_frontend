import { ContextRole } from '@/composables/types'

export interface RoleChangeMessage {
  model: string // Context model
  pk: number // Context primary key
  userids: number[]
  roles: string[]
}

export interface RolesGetMessage {
  model: string // Context model
  pk: number // Context primary key
  // eslint-disable-next-line camelcase
  filter_userids?: number[]
}

export interface RolesAvailableMessage {
  model: string // Context model
}

export interface ContextRolesPayload {
  items: [number, string[]][]
}

export interface AvailableRolesPayload {
  roles: ContextRole[]
}
