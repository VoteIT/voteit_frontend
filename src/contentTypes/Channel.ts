import DefaultMap from '@/utils/DefaultMap'

import { channelLeftEvent } from '@/composables/events'

type LeaveHandler = (pk: number) => void

const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
channelLeftEvent.on(({ channelType, pk }) => {
  for (const handler of leaveHandlers.get(channelType)) {
    handler(pk)
  }
})

export default class Channel {
  public name: string

  constructor(name: string) {
    this.name = name
  }

  public onLeave(fn: LeaveHandler) {
    leaveHandlers.get(this.name).push(fn)
    return this
  }
}
