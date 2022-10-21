/* eslint-disable camelcase */

import TypedEvent from './TypedEvent'

// For Channels
export enum State {
  Success = 's',
  Failed = 'f',
  Waiting = 'w', // Deprecated
  Queued = 'q',
  Running = 'r',
}

export interface Progress {
  curr: number
  total: number
  msg?: string
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
  s: State.Running | State.Waiting | State.Queued
  p: Progress
}

export interface PydanticError {
  loc: string[]
  msg: string
  type: string
}

interface ValidationError {
  msg: string
  errors: PydanticError[]
}

export interface FailedMessage extends BaseChannelsMessage {
  s: State.Failed
  p: ValidationError
}

export interface SubscribePayload {
  channel_type: string
  pk: number
}

export interface SubscribedPayload {
  app_state: SuccessMessage<object>[] | null
  channel_name: string
  channel_type: string
  pk: number
}

export interface BatchPayload {
  t: string
  payloads: object[]
}

export type ChannelsMessage<T=unknown> = SuccessMessage<T> | ProgressMessage | FailedMessage

export type ProgressHandler = (progress: Progress) => void

// For Socket.ts
export interface ChannelsConfig {
  timeout?: number
  alertOnError?: boolean
}

export enum ThemeColor {
  Accent = 'accent',
  Primary = 'primary',
  Secondary = 'secondary',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Success = 'success',
}
export type Color = 'accent' | 'background' | 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success'

interface MenuItemBase {
  title: string
  subtitle?: string
  icon?: string
  disabled?: boolean
  color?: ThemeColor
}

interface MenuSubheader {
  subheader: string
}

export interface MenuItemTo extends MenuItemBase {
  to: string
}

export interface MenuItemOnClick extends MenuItemBase {
  onClick: () => Promise<void>
}

export type MenuItem = '---' | MenuItemOnClick | MenuItemTo | MenuSubheader

export interface TreeMenuLink {
  title: string
  to: string // Can only be string, not route object, for matching purposes.
  icons?: string[]
  count?: number
  hasNewItems?: boolean
}

export interface TreeMenu {
  defaultOpen?: boolean
  icon?: string
  items: (TreeMenuLink | TreeMenu)[]
  loadedEvent?: TypedEvent
  openEvent?: TypedEvent
  openFirstNonEmpty?: boolean
  showCount?: boolean
  showCountTotal?: number
  slotAfter?: string
  slotBefore?: string
  title: string
}

export type TreeMenuItem = TreeMenuLink | TreeMenu

export interface LastRead {
  timestamp: string
  agenda_item: number
}
