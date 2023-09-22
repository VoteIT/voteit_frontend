import { computed, ref } from 'vue'
import router from '@/router'

import { agendaMenuPlugins } from '../agendas/registry'
import { meetingSettingsPlugins } from '../meetings/registry'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { Meeting, NoSettingsComponent } from '../meetings/types'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'
import ControlPanel from './ControlPanel.vue'
import useAgendaItem from '../agendas/useAgendaItem'

function checkActive (meeting: Meeting) {
  const { component } = useMeetingComponent<NoSettingsComponent>(ref(meeting.pk), 'proposal_print')
  return component.value?.state === 'on'
}

proposalButtonPlugins.register({
  id: 'printing',
  checkActive,
  component: ProposalPrintButton
})

agendaMenuPlugins.register({
  id: 'printing',
  checkActive,
  getItems ({ agendaItem, menu, t }) {
    if (menu !== 'main') return []
    const { getAgendaItemRoute } = useAgendaItem(computed(() => agendaItem.pk))
    return [{
      title: t('printing.proposals'),
      icon: 'mdi-printer',
      to: getAgendaItemRoute('printing:proposals', { propIds: '-' } )!
    }]
  }
})

meetingSettingsPlugins.register({
  id: 'printing',
  icon: 'mdi-printer',
  quickComponent: ControlPanel,
  getTitle (t) {
    return t('printing.proposals')
  }
})

router.addRoute('MeetingRouterView', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds'
})
