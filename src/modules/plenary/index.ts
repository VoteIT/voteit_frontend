import { sortBy } from 'lodash'
import { toRef } from 'vue'

import { agendaMenuPlugins } from '../agendas/registry'
import useRooms from '../rooms/useRooms'
import useMeeting from '../meetings/useMeeting'
import { meetingMenuPlugins } from '../meetings/registry'
import { Meeting } from '../meetings/types'
import { AgendaMenuPlugin } from '../agendas/types'
import useAgenda from '../agendas/useAgenda'

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
  if (!agendaItem) agendaItem = useAgenda(toRef(meeting, 'pk')).agenda.value[0]
  if (!agendaItem) return []
  function getRoomMenu(roomId: number, title: string) {
    return {
      title,
      prependIcon: 'mdi-gavel',
      to: {
        name: 'Plenary',
        params: {
          id: meeting.pk,
          aid: agendaItem!.pk,
          roomId,
          tab: 'decisions'
        }
      }
    }
  }
  return meetingRooms.value.length === 1
    ? [getRoomMenu(meetingRooms.value[0].pk, t('plenary.view'))]
    : sortBy(meetingRooms.value, 'title').map((room) =>
        getRoomMenu(room.pk, `${t('plenary.view')} (${room.title})`)
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
