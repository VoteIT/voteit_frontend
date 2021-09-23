/* eslint-disable camelcase */
import { User } from '@/contentTypes/types'
import { MeetingRole } from '@/modules/meetings/types'
import { ThemeColor } from '@/utils/types'
import { AxiosRequestConfig } from 'axios'
import { Component } from 'vue'

export interface RestApiConfig extends AxiosRequestConfig {
  alertOnError?: boolean
}

export interface Modal {
  title?: string
  dismissable?: boolean
  component?: Component
  data?: Object
  html?: string
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
}

export interface Dialog {
  title: string
  resolve: (value: unknown) => void
  yes?: string
  no?: string
  theme?: ThemeColor
}

export interface MeetingRoles {
  pk: number
  user: User
  meeting: number
  assigned: MeetingRole[]
}

export interface UserMeetingRoles {
  user: number
  assigned: Set<MeetingRole>
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
