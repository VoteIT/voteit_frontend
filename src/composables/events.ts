import TypedEvent from '@/utils/TypedEvent'

interface PathedChannel {
  channelType: string
  pk: number
  path: string
}

export const channelLeftEvent = new TypedEvent<PathedChannel>()
export const channelSubscribedEvent = new TypedEvent<PathedChannel>()
export const beforeAppStateEvent = new TypedEvent<{
  channelType: string
  pk: number
}>()
