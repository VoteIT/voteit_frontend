import { channelSubscribedEvent } from '@/composables/events'
import TypedEvent from '@/utils/TypedEvent'

export const agendaDeletedEvent = new TypedEvent<number>()
export const agendaLoadedEvent = new TypedEvent()

channelSubscribedEvent.on(({ channelType }) => {
  // Agenda is loaded when "participants" or "moderators" channels are subscribed
  if (['participants', 'moderators'].includes(channelType))
    agendaLoadedEvent.emit()
})
