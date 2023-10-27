import { meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'

meetingSettingsPlugins.register({
  id: 'rooms',
  component: ControlPanel,
  icon: 'mdi-door',
  getTitle(t) {
    return t('room.rooms')
  }
})
