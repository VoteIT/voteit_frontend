import router from '@/router'
import { agendaMenuPlugins } from '../agendas/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'

proposalButtonPlugins.register({
  checkActive (meeting) {
    return true
  },
  component: ProposalPrintButton
})

agendaMenuPlugins.register({
  checkActive (meeting) {
    return true
  },
  getItems ({ agendaItemPath, menu, t }) {
    if (menu !== 'main') return []
    return [{
      title: t('printing.proposals'),
      icon: 'mdi-printer',
      to: `${agendaItemPath}/print/-`
    }]
  }
})

router.addRoute('Meeting', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds'
})
