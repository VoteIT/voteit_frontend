import { meetingSettingsPlugins } from '../meetings/registry.js'

import ImportsControlPanel from './ImportsControlPanel.vue'
import ExportsControlPanel from './ExportsControlPanel.vue'

meetingSettingsPlugins.register({
  id: 'meeting_import',
  component: ImportsControlPanel,
  icon: 'mdi-file-import',
  checkAdvanced() {
    return true
  },
  getDescription(t) {
    return t('exportImport.description')
  },
  getTitle(t) {
    return t('exportImport.title')
  }
})

meetingSettingsPlugins.register({
  id: 'exports',
  component: ExportsControlPanel,
  getDescription(t) {
    return t('exportImport.exportsDescription')
  },
  icon: 'mdi-file-export',
  getTitle(t) {
    return t('exportImport.exports')
  }
})
