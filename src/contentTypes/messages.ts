/* eslint-disable camelcase */
import { ContextRole } from '@/composables/types'

export interface RoleChangeMessage {
  model: string // Context model
  pk: number // Context primary key
  users: number[]
  roles: any[]
}

export interface RolesGetMessage {
  model: string // Context model
  pk: number // Context primary key
  // eslint-disable-next-line camelcase
  filter_users?: number[]
}

export interface RolesAvailableMessage {
  model: string // Context model
}

export interface ContextRolesPayload<R = string> {
  items: [number, R[]][]
}

export interface AvailableRolesPayload {
  roles: ContextRole[]
}
