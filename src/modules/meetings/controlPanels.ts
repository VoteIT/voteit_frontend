import AccessPolicies from './accessPolicies/ControlPanel.vue'
import APQuick from './accessPolicies/QuickPanel.vue'
import ExportsControlPanel from './ExportsControlPanel.vue'
import ElectoralRegisters from './electoralRegisters/ControlPanel.vue'
import ERQuick from './electoralRegisters/QuickPanel.vue'
import DialectQuick from './dialects/QuickPanel.vue'
import DialectControlPanel from './dialects/ControlPanel.vue'
// import PresenceChecks from '../presence/ControlPanel.vue'
import SpeakerSystems from '../speakerLists/ControlPanel.vue'
import { meetingSettingsPlugins } from './registry'

meetingSettingsPlugins.register({
  id: 'dialect',
  component: DialectControlPanel,
  quickComponent: DialectQuick,
  icon: 'mdi-brush-variant',
  getTitle(t) {
    return t('meeting.dialect')
  },
  checkActive(meeting) {
    return !!meeting.dialect
  }
})

meetingSettingsPlugins.register({
  id: 'aps',
  component: AccessPolicies,
  quickComponent: APQuick,
  icon: 'mdi-key',
  getTitle(t) {
    return t('accessPolicy.plural')
  }
})

meetingSettingsPlugins.register({
  id: 'ers',
  component: ElectoralRegisters,
  quickComponent: ERQuick,
  icon: 'mdi-vote',
  getTitle(t) {
    return t('electoralRegister.plural')
  }
})

meetingSettingsPlugins.register({
  id: 'exports',
  component: ExportsControlPanel,
  getDescription(t) {
    return t('meeting.exportsDescription')
  },
  icon: 'mdi-file-download',
  getTitle(t) {
    return t('meeting.exports')
  }
})
