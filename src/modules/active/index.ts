import { toRef } from 'vue'

import { countMatching } from '@/utils'
import {
  meetingGroupTablePlugins,
  meetingRolePlugins,
  meetingSettingsPlugins,
  meetingSlotPlugins
} from '../meetings/registry'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { Meeting, MeetingState } from '../meetings/types'

import ControlPanel from './ControlPanel.vue'
import MenuPlugin from './MenuPlugin.vue'
import useActive from './useActive'

const COMPONENT_NAME = 'active_users'

function checkActive(meeting: Meeting) {
  return useMeetingComponent(meeting.pk, COMPONENT_NAME).componentActive.value
}

meetingSettingsPlugins.register({
  id: COMPONENT_NAME,
  icon: 'mdi-account-network',
  getTitle(t) {
    return t('activeUsers.title')
  },
  quickComponent: ControlPanel
})

meetingSlotPlugins.register({
  checkActive,
  component: MenuPlugin,
  id: COMPONENT_NAME,
  slot: 'appendMenu'
})

meetingRolePlugins.register({
  checkActive,
  contentType: 'meeting',
  id: COMPONENT_NAME,
  transform(columns, meeting) {
    const { activeUserIds } = useActive(toRef(meeting, 'pk'))
    return [
      ...columns,
      {
        getCount() {
          return activeUserIds.value.length
        },
        getDescription(t) {
          return t('activeUsers.roleHelp')
        },
        getTitle(t) {
          return t('activeUsers.active')
        },
        getValue({ user }) {
          return activeUserIds.value.includes(user)
        },
        icon: 'mdi-account-network',
        name: COMPONENT_NAME,
        readonly: true
      }
    ]
  }
})

meetingGroupTablePlugins.register({
  checkActive,
  id: COMPONENT_NAME,
  transform(columns, meeting) {
    if (![MeetingState.Upcoming, MeetingState.Ongoing].includes(meeting.state))
      return columns
    const meetingId = toRef(meeting, 'pk')
    const { checkActive } = useActive(meetingId)
    return [
      ...columns,
      {
        name: COMPONENT_NAME,
        getDescription(t) {
          return t('activeUsers.groupActiveDescription')
        },
        getValue(group) {
          return countMatching(group.memberships, (m) => checkActive(m.user))
        },
        getTitle(t) {
          return t('activeUsers.activePlural')
        }
      }
    ]
  }
})
