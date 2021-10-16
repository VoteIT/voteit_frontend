import { ControlPanelComponent } from './types'
import AccessPolicies from './AccessPolicies.vue'
import Agenda from '@/modules/agendas/ControlPanel.vue'
import ElectoralRegisters from './ElectoralRegisters.vue'
import PresenceChecks from './PresenceChecks.vue'
import Reactions from './Reactions.vue'
import SpeakerSystems from '../../../modules/speakerLists/ControlPanel.vue'

export default {
  AccessPolicies,
  Agenda,
  ElectoralRegisters,
  PresenceChecks,
  Reactions,
  SpeakerSystems
} as Record<string, ControlPanelComponent>
