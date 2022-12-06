import { getApiLink } from '@/utils/restApi'

import { meetingExportPlugins, meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'
import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'agenda',
  component: ControlPanel,
  quickComponent: QuickPanel,
  icon: 'mdi-clipboard-list',
  translationKey: 'agenda.agenda'
})

function getDownloadFormat (meeting: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-agenda-items/${meeting}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'agenda',
  getExports (t, meetingId) {
    return [{
      formats: [
        getDownloadFormat(meetingId, 'csv'),
        getDownloadFormat(meetingId, 'json')
      ]
    }]
  },
  getTitle (t) {
    return t('agenda.agenda')
  }
})
