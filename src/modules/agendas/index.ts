import { getApiLink } from '@/utils/restApi'

import {
  meetingExportPlugins,
  meetingSettingsPlugins
} from '../meetings/registry'
import useMeetingId from '../meetings/useMeetingId'

import useAgenda from './useAgenda'

meetingSettingsPlugins.register({
  id: 'agenda',
  route: { name: 'agendaEdit' },
  icon: 'mdi-clipboard-list',
  getDescription(t) {
    const { agenda } = useAgenda(useMeetingId())
    return t('agenda.itemCount', agenda.value.length)
  },
  getTitle(t) {
    return t('agenda.agenda')
  }
})

function getDownloadFormat(meeting: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-agenda-items/${meeting}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'agenda',
  getExports(t, meetingId) {
    return [
      {
        formats: [
          getDownloadFormat(meetingId, 'csv'),
          getDownloadFormat(meetingId, 'json')
        ]
      }
    ]
  },
  getTitle(t) {
    return t('agenda.agenda')
  }
})
