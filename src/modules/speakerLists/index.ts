import { getApiLink } from '@/utils/restApi'
import { registerValidator } from '@/composables/useStateMachine'

import { agendaItemType } from '../agendas/contentTypes'
import { meetingExportPlugins } from '../exportImport/registry'
import useRoomStore from '../rooms/useRoomStore'

import useSpeakerStore from './useSpeakerStore'
import * as rules from './rules'

function getDownloadFormat(system: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-speakers/${system}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'speakerHistory',
  getExports(meetingId) {
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

agendaItemType.sm.registerGuard('close', (ai, t) => {
  if (
    useSpeakerStore().anySpeakerList(
      (sl) => sl.agenda_item === ai.pk && !!sl.current
    )
  )
    return { text: t('speaker.agendaItemHasOngoingSpeaker'), isBlocking: true }
})

const MACHINE = 'SpeakerSystemStateMachine'
registerValidator(
  MACHINE,
  'has_change_permission',
  (s, t) => rules.canChangeSpeakerSystem(s) || t('speaker.cantChangeSystem')
)
registerValidator(
  MACHINE,
  'no_active_speaker',
  (s, t) => !rules.hasActiveSpeaker(s) || t('speaker.hasActiveSpeaker')
)
