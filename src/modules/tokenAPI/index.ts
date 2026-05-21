// This module exists to add a control panel for handling meeting API tokens

import { meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'

meetingSettingsPlugins.register({
  getTitle() {
    return 'Token API (advanced)'
  },
  icon: 'mdi-key-chain',
  id: 'token-api',
  checkActive() {
    return false
  },
  component: ControlPanel
})
