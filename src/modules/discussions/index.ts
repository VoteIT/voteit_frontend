import { getApiLink } from '@/utils/restApi'

import { meetingExportPlugins } from '../meetings/registry'

function getDownloadFormat (meeting: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-discussion-posts/${meeting}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'discussions',
  getExports (t, meetingId) {
    return [{
      formats: [
        getDownloadFormat(meetingId, 'csv'),
        getDownloadFormat(meetingId, 'json')
      ]
    }]
  },
  getTitle (t) {
    return t('discussion.discussions')
  }
})
