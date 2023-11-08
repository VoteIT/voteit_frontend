import { sortBy } from 'lodash'
import { toRef } from 'vue'
import { agendaMenuPlugins } from '../agendas/registry'
import useRooms from '../rooms/useRooms'
import useMeeting from '../meetings/useMeeting'

agendaMenuPlugins.register({
  id: 'plenary',
  checkActive(meeting) {
    return (
      !!useMeeting().isModerator.value &&
      !!useRooms(toRef(meeting, 'pk')).meetingRooms.value.length
    )
  },
  getItems({ agendaItem, meeting, t }) {
    const { meetingRooms } = useRooms(toRef(meeting, 'pk'))
    function getRoomMenu(roomId: number, title: string) {
      return {
        title,
        prependIcon: 'mdi-gavel',
        to: {
          name: 'Plenary',
          params: {
            id: meeting.pk,
            aid: agendaItem.pk,
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
})
