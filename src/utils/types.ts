/* eslint-disable camelcase */
export enum State {
  Success = 's',
  Failed = 'f',
  Waiting = 'w',
  Running = 'r',
}

export interface BaseChannelsMessage {
  t: string
  i: string
}

export interface SuccessMessage extends BaseChannelsMessage {
  s: State.Success
  p: object
}

export interface ProgressMessage extends BaseChannelsMessage {
  s: State.Running | State.Waiting
  p: Progress
}

interface MessageObject {
  msg: string
}

export interface FailedMessage extends BaseChannelsMessage {
  s: State.Failed
  p: MessageObject
}

export type ChannelsMessage = SuccessMessage | ProgressMessage | FailedMessage

export interface Progress {
  curr: number
  total: number
  msg?: string
}

export type ProgressHandler = (progress: Progress) => void

export interface ChannelsConfig {
  timeout?: number
  alertOnError?: boolean
}

// Deprecated
export interface NewDevUser {
  username: string
  is_superuser: boolean
}

// Deprecated
export interface DevUser extends NewDevUser {
  pk: number
}

export interface User {
  pk: number
  username: string
  full_name: string
  first_name: string
  last_name: string
}

export enum ThemeColor {
  Primary = 'primary',
  Secondary = 'secondary',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Success = 'success',
}

export interface MenuDescriptor {
  text: string
  icon?: string
  onClick: () => Promise<any>
  disabled?: boolean
  color?: ThemeColor
}

export type MenuItem = '---' | MenuDescriptor

export interface TreeMenuLink {
  title: string
  to: string
  icons?: string[]
  count?: number
}

export interface TreeMenu {
  title: string
  items: TreeMenuItem[]
  defaultOpen?: boolean
  openFirstNonEmpty?: boolean
  showCount?: boolean
  icon?: string
}

export type TreeMenuItem = TreeMenuLink | TreeMenu
