import restApi from '@/utils/restApi'
import { filter } from 'itertools'

import { meetingExportPlugins } from '../meetings/registry'
import { speakerSystems } from './useSpeakerLists'
import { meetingRoomStore } from '../rooms/useRooms'

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
