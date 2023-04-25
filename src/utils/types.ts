/* eslint-disable camelcase */
import { RouteLocationRaw } from 'vue-router'

import TypedEvent from './TypedEvent'

/* Util types */
export type Nullable<T> = T | null | undefined
export type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}

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
  p: Progress | null
}

export interface PydanticError {
  loc: string[]
  msg: string
  type: string
}

export interface ErrorPayload {
  msg: string
}

export interface ValidationErrorPayload extends ErrorPayload {
  msg: string
  errors: PydanticError[]
}

export interface FailedMessage extends BaseChannelsMessage {
  s: State.Failed
  p: ValidationErrorPayload | ErrorPayload
}

export function isValidationErrorPayload (p: FailedMessage['p']): p is ValidationErrorPayload {
  return 'errors' in p
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
  appendIcon?: string
  prependIcon?: string
  disabled?: boolean
  color?: ThemeColor
}

export interface MenuSubheader {
  subheader: string
}

export interface MenuItemHref extends MenuItemBase {
  href: string
}

export interface MenuItemTo extends MenuItemBase {
  to: RouteLocationRaw
}

export interface MenuItemOnClick extends MenuItemBase {
  onClick: () => Promise<void>
}

export type MenuItem = '---' | MenuItemOnClick | MenuItemTo | MenuItemHref | MenuSubheader

export interface TreeMenuLink {
  count?: number
  exactActive?: boolean // Only show as active if exact-active
  hasNewItems?: boolean
  icons?: string[]
  title: string
  to: RouteLocationRaw // Can only be string, not route object, for matching purposes.
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

export function isTreeLink (item: TreeMenuItem): item is TreeMenuLink {
  return 'to' in item
}

export function isTreeMenu (item: TreeMenuItem): item is TreeMenu {
  return 'items' in item
}

export interface LastRead {
  timestamp: string
  agenda_item: number
}
