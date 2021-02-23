/* eslint-disable camelcase */
import { ChannelsConfig, Payload } from '@/utils/types'
import { AxiosRequestConfig } from 'axios'

export interface ChannelConfig extends ChannelsConfig {
  alertOnError: boolean
  leaveDelay: number
}

export interface RestApiConfig extends AxiosRequestConfig {
  alertOnError?: boolean
}

export interface Modal {
}

export interface Alert {
}

export interface ContextRoles extends Payload {
  model: string
  pk: number
  user_pk: number
  roles: string[]
}
