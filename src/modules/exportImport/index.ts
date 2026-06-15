import { meetingSettingsPlugins } from '../meetings/registry.js'

import ControlPanel from './ControlPanel.vue'

meetingSettingsPlugins.register({
  id: 'exportImport',
  component: ControlPanel,
  icon: 'mdi-swap-horizontal',
  checkAdvanced() {
    return true
  },
  getDescription(t) {
    return t('exportImport.importAndExportDescription')
  },
  getTitle(t) {
    return t('exportImport.importAndExport')
  }
})
