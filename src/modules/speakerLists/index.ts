import { filter } from 'itertools'

import restApi from '@/utils/restApi'

import { agendaItemType } from '../agendas/contentTypes'
import { AgendaTransition } from '../agendas/types'
import { meetingExportPlugins } from '../meetings/registry'
import useRoomStore from '../rooms/useRoomStore'

import useSpeakerStore from './useSpeakerStore'

function getDownloadFormat(system: number, format: 'csv' | 'json') {
  return {
    format,
    url: `${restApi.defaults.baseURL}export-speakers/${system}/${format}/`
  }
}

meetingExportPlugins.register({
  id: 'speakerHistory',
  getExports(t, meetingId) {
    const systems = useSpeakerStore().getSpeakerSystems(meetingId)
    const { getRoom } = useRoomStore()
    return systems.map(({ pk, room }) => {
      return {
        title: getRoom(room)?.title ?? '-',
        formats: [getDownloadFormat(pk, 'csv'), getDownloadFormat(pk, 'json')]
      }
    })
  },
  getTitle(t) {
    return t('speaker.history')
  }
})

agendaItemType.transitions.registerGuard(AgendaTransition.Close, (ai, t) => {
  if (
    useSpeakerStore().anySpeakerList(
      (sl) => sl.agenda_item === ai.pk && !!sl.current
    )
  )
    return { text: t('speaker.agendaItemHasOngoingSpeaker'), isBlocking: true }
})
