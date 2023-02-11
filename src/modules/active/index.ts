import { ref } from 'vue'

import { meetingSettingsPlugins, meetingSlotPlugins } from '../meetings/registry'
import useMeetingComponents from '../meetings/useMeetingComponent'
import type { Meeting, NoSettingsComponent } from '../meetings/types'

import ControlPanel from './ControlPanel.vue'
import ManageActive from './ManageActive.vue'
import MenuPlugin from './MenuPlugin.vue'

const COMPONENT_NAME = 'active_users'

function checkActive (meeting: Meeting) {
  const { component } = useMeetingComponents<NoSettingsComponent<typeof COMPONENT_NAME>>(ref(meeting.pk), COMPONENT_NAME)
  return component.value?.state === 'on'
}

meetingSettingsPlugins.register({
  id: COMPONENT_NAME,
  icon: 'mdi-account-network',
  translationKey: 'activeUsers.title',
  isConfigured () {
    return false
  },
  quickComponent: ControlPanel
})

meetingSlotPlugins.register({
  checkActive,
  component: MenuPlugin,
  id: COMPONENT_NAME,
  slot: 'appendMenu'
})

meetingSlotPlugins.register({
  checkActive,
  component: ManageActive,
  id: 'active_users.controls',
  slot: 'presenceMain'
})
