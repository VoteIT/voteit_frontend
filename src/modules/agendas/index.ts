import { meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'
import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'agenda',
  component: ControlPanel,
  quickComponent: QuickPanel,
  icon: 'mdi-clipboard-list',
  translationKey: 'agenda.agenda'
})
