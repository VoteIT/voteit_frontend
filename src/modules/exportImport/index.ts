import { meetingSettingsPlugins } from '../meetings/registry.js'
import { MeetingState } from '../meetings/types.js'

import ControlPanel from './ControlPanel.vue'
import DownloadSection from './DownloadSection.vue'
import ExportSection from './ExportSection.vue'
import ImportSection from './ImportSection.vue'

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
  getTabs(meeting, t) {
    return [
      {
        id: 'import',
        title: t('exportImport.import'),
        disabled: meeting.state !== MeetingState.Upcoming,
        component: ImportSection,
        icon: 'mdi-import'
      },
      {
        id: 'export',
        title: t('exportImport.export'),
        component: ExportSection,
        icon: 'mdi-export'
      },
      {
        id: 'download',
        title: t('download'),
        component: DownloadSection,
        icon: 'mdi-download'
      }
    ]
  },
  getTitle(t) {
    return t('exportImport.importAndExport')
  }
})
