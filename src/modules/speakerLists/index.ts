import restApi from '@/utils/restApi'
import { filter } from 'itertools'

import { meetingExportPlugins } from '../meetings/registry'
import { speakerSystems } from './useSpeakerLists'

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
    return systems.map(({ pk, title }) => {
      return {
        title,
        formats: [getDownloadFormat(pk, 'csv'), getDownloadFormat(pk, 'json')]
      }
    })
  },
  getTitle(t) {
    return t('speaker.history')
  }
})
