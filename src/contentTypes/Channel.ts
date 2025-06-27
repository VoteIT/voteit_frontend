import { SuccessMessage } from '@/utils/types'
import DefaultMap from '@/utils/DefaultMap'

import { ChannelConfig, SchemaType } from './types'
import { socket } from '@/utils/Socket'
import { channelLeftEvent } from '@/composables/events'

type LeaveHandler = (pk: number) => void

const DEFAULT_CONFIG: ChannelConfig = {
  leaveDelay: 10_000 // Delay before leaving channel in ms
}
const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
channelLeftEvent.on(({ channelType, pk }) => {
  for (const handler of leaveHandlers.get(channelType)) {
    handler(pk)
  }
})

export default class Channel {
  public name: string
  private config: ChannelConfig

  constructor(name: string, config?: ChannelConfig) {
    this.name = name
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
  }

  public onLeave(fn: LeaveHandler) {
    leaveHandlers.get(this.name).push(fn)
    return this
  }

  // Wrap call and handle request errors (Timeout only?)
  private call<RT = unknown>(
    uri: string,
    data?: object,
    config?: ChannelConfig
  ) {
    config = { ...this.config, ...(config || {}) }
    return socket.call<RT>(uri, data, config)
  }

  public getSchema(
    message_type: string,
    type: SchemaType = SchemaType.Incoming
  ): Promise<SuccessMessage<{ message_schema: object }>> {
    return this.call(`schema.get_${type}`, { message_type })
  }
}
