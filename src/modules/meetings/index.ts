import restApi from '@/utils/restApi'

import { meetingExportPlugins } from './registry'

function getDownloadFormat (meetingId: number, format: 'csv' | 'json') {
  return {
    format,
    url: `${restApi.defaults.baseURL}export-participants/${meetingId}/${format}/`
  }
}

meetingExportPlugins.register({
  id: 'participants',
  getExports (t, meetingId) {
    return [{
      formats: [
        getDownloadFormat(meetingId, 'csv'),
        getDownloadFormat(meetingId, 'json')
      ]
    }]
  },
  getTitle (t) {
    return t('meeting.participants')
  }
})
