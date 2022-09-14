import router from '@/router'
import { proposalButtonPlugins } from '../proposals/registry'

import ProposalPrintButton from './ProposalPrintButton.vue'
import ProposalPrintView from './ProposalPrintView.vue'

proposalButtonPlugins.register({
  checkActive (meeting) {
    return true
  },
  component: ProposalPrintButton
})

router.addRoute('Meeting', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print'
})

router.addRoute('Meeting', {
  component: ProposalPrintView,
  name: 'printing:proposals',
  path: 'a/:aid/:aslug/print/:propIds'
})
