import TypedEvent from '@/utils/TypedEvent'

import { moderatorChannel, participantChannel } from '../meetings/contentTypes'

export const agendaDeletedEvent = new TypedEvent<number>()
export const agendaLoadedEvent = new TypedEvent()

// Agenda is loaded when "participants" or "moderators" channels are subscribed
for (const channel of [participantChannel, moderatorChannel])
  channel.onSubscribe(() => agendaLoadedEvent.emit())
