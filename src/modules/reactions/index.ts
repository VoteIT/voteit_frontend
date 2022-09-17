import { meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'
import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'reactions',
  component: ControlPanel,
  quickComponent: QuickPanel,
  icon: 'mdi-thumb-up',
  translationKey: 'reaction.buttons'
})
