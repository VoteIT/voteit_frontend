import router from '@/router'

import { meetingSettingsPlugins } from '../meetings/registry'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { Meeting } from '../meetings/types'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'
import ControlPanel from './ControlPanel.vue'

function checkActive(meeting: Meeting) {
  return useMeetingComponent(meeting.pk, 'proposal_print').componentActive.value
}

proposalButtonPlugins.register({
  id: 'printing',
  checkActive,
  component: ProposalPrintButton
})

meetingSettingsPlugins.register({
  id: 'printing',
  icon: 'mdi-printer',
  quickComponent: ControlPanel,
  getTitle(t) {
    return t('printing.proposals')
  }
})

router.addRoute('MeetingRouterView', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds'
})
