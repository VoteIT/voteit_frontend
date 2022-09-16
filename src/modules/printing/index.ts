import { ref } from 'vue'
import router from '@/router'

import { agendaMenuPlugins } from '../agendas/registry'
import { meetingSettingsPlugins } from '../meetings/registry'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { Meeting, NoSettingsComponent } from '../meetings/types'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'
import ControlPanel from './ControlPanel.vue'

function checkActive (meeting: Meeting) {
  const { component } = useMeetingComponent<NoSettingsComponent>(ref(meeting.pk), 'proposal_print')
  return component.value?.state === 'on'
}

proposalButtonPlugins.register({
  checkActive,
  component: ProposalPrintButton
})

agendaMenuPlugins.register({
  checkActive,
  getItems ({ agendaItemPath, menu, t }) {
    if (menu !== 'main') return []
    return [{
      title: t('printing.proposals'),
      icon: 'mdi-printer',
      to: `${agendaItemPath}/print/-`
    }]
  }
})

meetingSettingsPlugins.register({
  id: 'printing',
  icon: 'mdi-printer',
  translationKey: 'printing.proposals',
  isConfigured (meeting) {
    return false
  },
  quickComponent: ControlPanel
})

router.addRoute('Meeting', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds'
})
