import AccessPolicies from './accessPolicies/ControlPanel.vue'
import APQuick from './accessPolicies/QuickPanel.vue'
import ExportsControlPanel from './ExportsControlPanel.vue'
import ElectoralRegisters from './electoralRegisters/ControlPanel.vue'
import ERQuick from './electoralRegisters/QuickPanel.vue'
import DialectQuick from './dialects/QuickPanel.vue'
// import PresenceChecks from '../presence/ControlPanel.vue'
import SpeakerSystems from '../speakerLists/ControlPanel.vue'
import { meetingSettingsPlugins } from './registry'

meetingSettingsPlugins.register({
  id: 'dialect',
  quickComponent: DialectQuick,
  icon: 'mdi-brush-variant',
  translationKey: 'meeting.dialect',
  checkActive (meeting) {
    return !!meeting.dialect
  }
})

meetingSettingsPlugins.register({
  id: 'aps',
  component: AccessPolicies,
  quickComponent: APQuick,
  icon: 'mdi-key',
  translationKey: 'accessPolicy.plural'
})

meetingSettingsPlugins.register({
  id: 'ers',
  component: ElectoralRegisters,
  quickComponent: ERQuick,
  icon: 'mdi-vote',
  translationKey: 'electoralRegister.plural'
})

meetingSettingsPlugins.register({
  id: 'exports',
  component: ExportsControlPanel,
  getDescription (t) {
    return t('meeting.exportsDescription')
  },
  icon: 'mdi-file-download',
  translationKey: 'meeting.exports'
})

// TODO Move registration to module
meetingSettingsPlugins.register({
  id: 'speakers',
  component: SpeakerSystems,
  getDescription: (t) => t('speaker.settings'),
  icon: 'mdi-account-voice',
  translationKey: 'speaker.systems'
})
