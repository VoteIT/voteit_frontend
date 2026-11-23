import router from '@/router'

import { agendaItemRequirement } from '../agendas/requirements'
import { meetingSettingsPlugins } from '../meetings/registry'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { Meeting } from '../meetings/types'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'
import ControlPanel from './ControlPanel.vue'

const COMPONENT_NAME = 'proposal_print'

function checkActive(meeting: Meeting) {
  return useMeetingComponent(meeting.pk, COMPONENT_NAME).componentActive.value
}

proposalButtonPlugins.register({
  id: 'printing',
  checkActive,
  component: ProposalPrintButton
})

meetingSettingsPlugins.register({
  id: COMPONENT_NAME,
  icon: 'mdi-printer',
  quickComponent: ControlPanel,
  getTitle(t) {
    return t('printing.proposals')
  }
})

router.addRoute('MeetingRouterView', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds',
  meta: { load: agendaItemRequirement }
})
