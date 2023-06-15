/* eslint-disable camelcase */
import { MeetingRole } from '@/modules/meetings/types'
import { OrganisationRole, User } from '@/modules/organisations/types'
import { ThemeColor } from '@/utils/types'
import { AxiosRequestConfig } from 'axios'
import { Component } from 'vue'

export interface RestApiConfig extends AxiosRequestConfig {
  alertOnError?: boolean
}

export interface Modal {
  component?: Component
  data?: object
  dismissable?: boolean
  html?: string
  title?: string
}

interface ComponentModal extends Modal {
  component: Component
  data?: object
}

interface HTMLModal extends Modal {
  html: string
}

export function isComponentModal (modal: Modal): modal is ComponentModal {
  return !!modal.component
}
export function isHTMLModal (modal: Modal): modal is HTMLModal {
  return !!modal.html
}

export enum AlertLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export interface Alert {
  level: AlertLevel
  title: string
  text: string
  sticky?: boolean
  active?: boolean
}

export interface Dialog {
  title: string
  resolve: (value: boolean) => void
  dismissible?: boolean
  yes?: string | false
  no?: string | false
  theme?: ThemeColor
}

export interface OrganisationRoles {
  pk: number,
  user: User,
  assigned: OrganisationRole[]
}

export interface MeetingRoles {
  pk: number
  user: Omit<User, 'organisation' | 'organisation_roles'>
  meeting: number
  assigned: MeetingRole[]
}

export interface UserContextRoles<T=string> {
  user: number,
  assigned: Set<T>
}

// Internal representation. Maybe change this
// FIXME
export interface ContextRoles {
  model: string
  pk: number
  roles: string[]
  user_pk: number
}

export interface ContextRole {
  model_natural_key: string
  name: string
  title: string
  description: string
  require_names?: string[]
  predicate_info?: any
}

export enum InitState {
  Loading = 0,
  Done = 1,
  Failed = 2
}
