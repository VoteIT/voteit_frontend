import { getApiLink } from '@/utils/restApi'

import { meetingExportPlugins } from '../meetings/registry'
import { agendaItemType } from '../agendas/contentTypes'
import { AgendaTransition } from '../agendas/types'
import { anyProposal } from './useProposals'
import { UNRESOLVED_STATES } from './constants'

function getDownloadFormat(meeting: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-proposals/${meeting}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'proposals',
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
    return t('proposal.proposals')
  }
})

agendaItemType.transitions.registerGuard(AgendaTransition.Close, (obj, t) => {
  if (
    anyProposal(
      (p) => p.agenda_item === obj.pk && UNRESOLVED_STATES.includes(p.state)
    )
  )
    return {
      message: t('proposal.agendaItemHasUnresolved')
    }
})
