import { ref, toRef } from 'vue'

import { meetingGroupTablePlugins, meetingRolePlugins, meetingSettingsPlugins, meetingSlotPlugins } from '../meetings/registry'
import useMeetingComponents from '../meetings/useMeetingComponent'
import { GroupMembership, Meeting, MeetingState, NoSettingsComponent } from '../meetings/types'

import ControlPanel from './ControlPanel.vue'
import MenuPlugin from './MenuPlugin.vue'
import useActive from './useActive'
// import useMeetingGroups from '../meetings/useMeetingGroups'
import { Predicate } from 'itertools'

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

meetingRolePlugins.register({
  checkActive,
  contentType: 'meeting',
  id: COMPONENT_NAME,
  transform (columns, meeting) {
    const { activeUserIds } = useActive(toRef(meeting, 'pk'))
    return [
      ...columns,
      {
        getCount () {
          return activeUserIds.value.length
        },
        getTitle (t) {
          return t('activeUsers.active')
        },
        getValue ({ user }) {
          return activeUserIds.value.includes(user)
        },
        icon: 'mdi-account-network',
        name: COMPONENT_NAME,
        readonly: true
      }
    ]
  }
})

function countActive (memberships: GroupMembership[], checkActive: Predicate<number>) {
  return memberships.reduce((acc, { user }) => acc + Number(checkActive(user)), 0)
}

meetingGroupTablePlugins.register({
  checkActive,
  id: COMPONENT_NAME,
  transform (columns, meeting) {
    if (![MeetingState.Upcoming, MeetingState.Ongoing].includes(meeting.state)) return columns
    const meetingId = toRef(meeting, 'pk')
    const { checkActive } = useActive(meetingId)
    // const { allGroupMembers } = useMeetingGroups(meetingId)
    return [
      ...columns,
      {
        name: COMPONENT_NAME,
        // getCount () {
        //   return countActive(allGroupMembers.value, checkActive)
        // },
        getDescription (t) {
          return t('activeUsers.groupActiveDescription')
        },
        getValue (group) {
          return countActive(group.memberships, checkActive)
        },
        getTitle (t) {
          return t('activeUsers.activePlural')
        }
      }
    ]
  }
})
