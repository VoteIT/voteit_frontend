/* eslint-disable camelcase */
export interface Payload {
  [ index: string ]: any
}

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
  p: Payload
}

export interface ProgressMessage extends BaseChannelsMessage {
  s: State.Running | State.Waiting
  p: ProgressObject
}

interface MessageObject {
  msg: string
}

export interface FailedMessage extends BaseChannelsMessage {
  s: State.Failed
  p: MessageObject
}

export type ChannelsMessage = SuccessMessage | ProgressMessage | FailedMessage

export interface ProgressObject {
  curr: number
  total: number
}

export type Progress = ProgressObject | number

export type ProgressHandler = (progress: Progress) => void

export interface ChannelsConfig {
  timeout?: number
  alertOnError?: boolean
}

export interface DevUser {
  pk: number
  username: string
  is_superuser: boolean
}
