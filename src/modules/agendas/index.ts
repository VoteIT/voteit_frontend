import { getApiLink } from '@/utils/restApi'

import {
  meetingExportPlugins,
  meetingSettingsPlugins
} from '../meetings/registry'
import useMeetingId from '../meetings/useMeetingId'

import useAgenda from './useAgenda'
import {
  notAllowed,
  noValidation,
  registerValidator
} from '@/composables/useStateMachine'
import { AgendaItem } from './types'
import { MeetingState } from '../meetings/types'
import useMeetingStore from '../meetings/useMeetingStore'

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

const MACHINE = 'AgendaItemStateMachine'
registerValidator(MACHINE, 'has_change_permission', noValidation)
registerValidator(MACHINE, 'no_ongoing_polls', noValidation)
registerValidator(MACHINE, 'not_allowed', notAllowed)
registerValidator(MACHINE, 'meeting_is_ongoing', (ai: AgendaItem) => {
  const meeting = useMeetingStore().getMeeting(ai.meeting)
  if (!meeting) return 'Meeting not found'
  return meeting.state === MeetingState.Ongoing || 'Meeting must be ongoing'
})
