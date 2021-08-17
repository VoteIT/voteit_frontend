/* eslint-disable camelcase */

// For Channels
export enum State {
  Success = 's',
  Failed = 'f',
  Waiting = 'w',
  Running = 'r',
}

export interface BaseChannelsMessage {
  t: string
  i: string | null
}

export interface SuccessMessage<T> extends BaseChannelsMessage {
  s?: State.Success
  p: T
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

export interface SubscribePayload {
  channel_type: string
  pk: number
}

interface SubscribedPayload {
  app_state: SuccessMessage<object>[] | null
  channel_name: string
  channel_type: string
  pk: number
}

export interface SubscribedMessage {
  i: string
  s: State.Success
  t: 'channel.subscribed'
  p: SubscribedPayload
}

export type ChannelsMessage = SuccessMessage<object> | ProgressMessage | FailedMessage | SubscribedMessage

export interface Progress {
  curr: number
  total: number
  msg?: string
}

export type ProgressHandler = (progress: Progress) => void

// For Socket.ts
export interface ChannelsConfig {
  timeout?: number
  alertOnError?: boolean
}

export enum ThemeColor {
  Primary = 'primary',
  Secondary = 'secondary',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Success = 'success',
}

interface MenuItemBase {
  text: string
  icon?: string
  disabled?: boolean
  color?: ThemeColor
}

export interface MenuItemTo extends MenuItemBase {
  to: string
}

export interface MenuItemOnClick extends MenuItemBase {
  onClick: () => Promise<void>
}

export type MenuItem = '---' | MenuItemOnClick | MenuItemTo

export interface TreeMenuLink {
  title: string
  to: string
  icons?: string[]
  count?: number
  hasNewItems?: boolean
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

export interface LastRead {
  timestamp: string
  agenda_item: number
}
