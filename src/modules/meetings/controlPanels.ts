import AccessPolicies from './accessPolicies/ControlPanel.vue'
import ElectoralRegisters from './electoralRegisters/ControlPanel.vue'
import Agenda from '../agendas/ControlPanel.vue'
// import PresenceChecks from '../presence/ControlPanel.vue'
import Reactions from '../reactions/ControlPanel.vue'
import SpeakerSystems from '../speakerLists/ControlPanel.vue'
import { meetingSettingsPlugins } from './registry'

meetingSettingsPlugins.register({
  id: 'aps',
  component: AccessPolicies,
  icon: 'mdi-key',
  translationKey: 'accessPolicy.plural'
})

meetingSettingsPlugins.register({
  id: 'agenda',
  component: Agenda,
  icon: 'mdi-clipboard-list',
  translationKey: 'agenda.agenda'
})

meetingSettingsPlugins.register({
  id: 'ers',
  component: ElectoralRegisters,
  icon: 'mdi-vote',
  translationKey: 'electoralRegister.plural'
})

meetingSettingsPlugins.register({
  id: 'reactions',
  component: Reactions,
  icon: 'mdi-thumb-up',
  translationKey: 'reaction.buttons'
})

meetingSettingsPlugins.register({
  id: 'speakers',
  component: SpeakerSystems,
  icon: 'mdi-account-voice',
  translationKey: 'speaker.systems'
})
