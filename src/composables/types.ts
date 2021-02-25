/* eslint-disable camelcase */
import { ChannelsConfig, Payload } from '@/utils/types'
import { AxiosRequestConfig } from 'axios'
import { Component } from 'vue'

export interface ChannelConfig extends ChannelsConfig {
  leaveDelay?: number
}

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

export interface ContextRoles extends Payload {
  model: string
  pk: number
  user_pk: number
  roles: string[]
}

export enum SchemaType {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}
