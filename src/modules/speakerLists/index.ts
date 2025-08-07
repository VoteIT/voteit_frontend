import { filter } from 'itertools'

import restApi from '@/utils/restApi'

import { agendaItemType } from '../agendas/contentTypes'
import { AgendaTransition } from '../agendas/types'
import { meetingExportPlugins } from '../meetings/registry'
import { meetingRoomStore } from '../rooms/useRooms'

import useSpeakerList from './useSpeakerList'
import { anySpeakerList, speakerSystems } from './useSpeakerLists'

function getDownloadFormat(system: number, format: 'csv' | 'json') {
  return {
    format,
    url: `${restApi.defaults.baseURL}export-speakers/${system}/${format}/`
  }
}

meetingExportPlugins.register({
  id: 'speakerHistory',
  getExports(t, meetingId) {
    const systems = filter(
      speakerSystems.values(),
      (s) => s.meeting === meetingId
    )
    return systems.map(({ pk, room }) => {
      return {
        title: meetingRoomStore.get(room)?.title ?? '-',
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
    anySpeakerList(
      (sl) =>
        sl.agenda_item === ai.pk && !!useSpeakerList(sl.pk).currentSpeaker.value
    )
  )
    return { text: t('speaker.agendaItemHasOngoingSpeaker'), isBlocking: true }
})
