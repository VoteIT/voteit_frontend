import { computed, watchEffect } from 'vue'

import AccessPolicies from './accessPolicies/ControlPanel.vue'
import APQuick from './accessPolicies/QuickPanel.vue'
import ElectoralRegisters from './electoralRegisters/ControlPanel.vue'
import ERQuick from './electoralRegisters/QuickPanel.vue'
import DialectQuick from './dialects/QuickPanel.vue'
import DialectControlPanel from './dialects/ControlPanel.vue'
import {
  loadAccessPoliciesQuietly,
  useAccessPolicyState
} from './accessPolicies/useAccessPolicies'
import { meetingSettingsPlugins } from './registry'
import useMeeting from './useMeeting'

meetingSettingsPlugins.register({
  id: 'dialect',
  component: DialectControlPanel,
  quickComponent: DialectQuick,
  icon: 'mdi-brush-variant',
  checkAdvanced(meeting) {
    return !meeting.dialect
  },
  getTitle(t) {
    return t('meeting.dialect')
  }
})

meetingSettingsPlugins.register({
  id: 'aps',
  component: AccessPolicies,
  quickComponent: APQuick,
  icon: 'mdi-key',
  getTitle(t) {
    return t('accessPolicy.plural')
  },
  useRequiresAttention() {
    const { canChange, meeting, meetingId } = useMeeting()
    const { hasActivePolicy, isLoaded } = useAccessPolicyState(meetingId)
    // Only those who can change the meeting may read its access policies.
    // Load quietly: this runs from the meeting menu, outside the control panel.
    watchEffect(() => {
      if (canChange.value && meetingId.value)
        loadAccessPoliciesQuietly(meetingId.value)
    })
    // Don't warn until we know which policies the meeting has
    return computed(
      () =>
        isLoaded.value &&
        !!meeting.value?.visible_in_lists &&
        !hasActivePolicy.value
    )
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
