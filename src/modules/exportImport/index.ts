import ControlPanel from './ControlPanel.vue'
import { meetingSettingsPlugins } from '../meetings/registry.js'

meetingSettingsPlugins.register({
  id: 'meeting_import',
  component: ControlPanel,
  icon: 'mdi-file-import',
  checkAdvanced() {
    return true
  },
  getDescription(t) {
    return t('meetingImport.description')
  },
  getTitle(t) {
    return t('meetingImport.title')
  }
})
