/* eslint-disable camelcase */
import { MeetingRole } from '@/contentTypes/types'
import { User } from '@/utils/types'
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

export interface Alert {
  level: string
  title: string
  text: string
  sticky?: boolean
}

export interface Dialog {
  title: string
  resolve: CallableFunction
  yes?: string
  no?: string
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

// Internal representation. Maybe change this
// FIXME
export interface ContextRoles {
  model: string
  pk: number
  roles: string[]
  user_pk: number
}
