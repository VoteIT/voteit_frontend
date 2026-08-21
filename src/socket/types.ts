import type Socket from './Socket'

export interface IChannelsMessage<T extends object = object> {
  action: string
  payload: T
}

export type TypeHandler<T extends object = object> = (
  data: IChannelsMessage<T>
) => void

export interface ChannelsConfig {
  timeout?: number
}

export const SocketState = {
  Undefined: undefined,
  Connecting: 0,
  Open: 1,
  Closing: 2,
  Closed: 3
} as const

export interface Heartbeat {
  callback(socket: Socket): void
  direction?: 'incoming' | 'outgoing'
  ms: number
  intervalID?: NodeJS.Timeout
}

export interface SocketOptions {
  config?: ChannelsConfig
  debug?: boolean
  manual?: boolean
}
