import TypedEvent from '@/utils/TypedEvent'

interface Channel {
  channel_type: string
  pk: number
}

export const channelSubscribedEvent = new TypedEvent<Channel>()
