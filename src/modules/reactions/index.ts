import { meetingSettingsPlugins } from '../meetings/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import ProposalButtons from './ProposalButtons.vue'
import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'reactions',
  component: ControlPanel,
  quickComponent: QuickPanel,
  icon: 'mdi-thumb-up',
  getTitle (t) {
    return t('reaction.buttons')
  }
})

proposalButtonPlugins.register({
  id: 'reactions',
  component: ProposalButtons
})
