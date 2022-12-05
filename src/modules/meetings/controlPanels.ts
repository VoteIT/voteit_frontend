import AccessPolicies from './accessPolicies/ControlPanel.vue'
import APQuick from './accessPolicies/QuickPanel.vue'
import ElectoralRegisters from './electoralRegisters/ControlPanel.vue'
import ERQuick from './electoralRegisters/QuickPanel.vue'
// import PresenceChecks from '../presence/ControlPanel.vue'
import SpeakerSystems from '../speakerLists/ControlPanel.vue'
import { meetingSettingsPlugins } from './registry'

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

// TODO Move registration to module
meetingSettingsPlugins.register({
  id: 'speakers',
  component: SpeakerSystems,
  getDescription: (t) => t('speaker.settings'),
  icon: 'mdi-account-voice',
  translationKey: 'speaker.systems'
})
