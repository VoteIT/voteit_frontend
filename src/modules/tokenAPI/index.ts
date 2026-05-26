// This module exists to add a control panel for handling meeting API tokens

import { meetingSettingsPlugins } from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'

meetingSettingsPlugins.register({
  getTitle(t) {
    return t('tokenAPI.title')
  },
  getDescription(t) {
    return t('tokenAPI.description')
  },
  advanced: true,
  icon: 'mdi-key-chain',
  id: 'token-api',
  component: ControlPanel
})
