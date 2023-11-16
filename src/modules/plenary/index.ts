import { sortBy } from 'lodash'
import { toRef } from 'vue'

import { agendaMenuPlugins } from '../agendas/registry'
import { AgendaMenuPlugin } from '../agendas/types'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import { meetingMenuPlugins } from '../meetings/registry'
import { Meeting } from '../meetings/types'
import useRooms from '../rooms/useRooms'
import { IMeetingRoom } from '../rooms/types'

function checkActive(meeting: Meeting) {
  return (
    !!useMeeting().isModerator.value &&
    !!useRooms(toRef(meeting, 'pk')).meetingRooms.value.length
  )
}

type GetItemsContext = Parameters<AgendaMenuPlugin['getItems']>[0]
type OptionalAIContext = Omit<GetItemsContext, 'agendaItem'> &
  Partial<Pick<GetItemsContext, 'agendaItem'>>

function getItems({ agendaItem, meeting, t }: OptionalAIContext) {
  const { meetingRooms } = useRooms(toRef(meeting, 'pk'))
  const firstAI = useAgenda(toRef(meeting, 'pk')).agenda.value[0]?.pk
  if (!firstAI) return [] // There is no Agenda for this meeting
  function getRoomMenu(room: IMeetingRoom, title: string) {
    return {
      title,
      prependIcon: 'mdi-gavel',
      to: {
        name: 'Plenary',
        params: {
          id: meeting.pk,
          aid: agendaItem?.pk ?? room.agenda_item ?? firstAI,
          roomId: room.pk,
          tab: 'decisions'
        }
      }
    }
  }
  return meetingRooms.value.length === 1
    ? [getRoomMenu(meetingRooms.value[0], t('plenary.view'))]
    : sortBy(meetingRooms.value, 'title').map((room) =>
        getRoomMenu(room, `${t('plenary.view')} (${room.title})`)
      )
}

agendaMenuPlugins.register({
  id: 'plenary',
  checkActive,
  getItems
})

meetingMenuPlugins.register({
  id: 'plenary',
  checkActive,
  getItems
})
