import { any, filter } from 'itertools'
import { sortBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'

import useAuthentication from '@/composables/useAuthentication'

import {
  groupMembershipType,
  groupRoleType,
  meetingGroupType
} from './contentTypes'
import { canChangeMeeting } from './rules'
import { GroupMembership, GroupRole, MeetingGroup } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'

const meetingGroups = reactive(new Map<number, MeetingGroup>())
meetingGroupType.updateMap(meetingGroups, { meeting: 'meeting' })

const groupRoles = reactive(new Map<number, GroupRole>())
groupRoleType.updateMap(groupRoles)

const groupMemberships = reactive(new Map<number, GroupMembership>())
groupMembershipType.updateMap(groupMemberships, { meeting: 'm' })

function getMeetingGroup(pk: number) {
  return meetingGroups.get(pk)
}

const { meetings } = useMeetings()

export default function useMeetingGroups(meetingId: Ref<number>) {
  const { user } = useAuthentication()
  const { isModerator } = useMeeting() // Warning: If meetingId above differs from useMeeting computed meetingId, we get the wrong value. This is inconsequential.

  function isGroupMember(
    group: (typeof orderedGroups)['value'][number]
  ): boolean {
    return group.memberships.some(
      (membership) => membership.user === user.value?.pk
    )
  }

  const _meetingGroups = computed(() =>
    filter(meetingGroups.values(), (group) => group.meeting === meetingId.value)
  )
  const allGroupMembers = computed(() =>
    filter(groupMemberships.values(), (m) =>
      any(_meetingGroups.value, (g) => g.pk === m.meeting_group)
    )
  )
  const memberCount = computed(() => allGroupMembers.value.length)
  const voteCount = computed(() =>
    allGroupMembers.value.reduce((acc, { votes }) => acc + (votes || 0), 0)
  )
  const canPostAs = computed(() => isModerator.value || userGroups.value.length)
  const roles = computed(() =>
    filter(groupRoles.values(), ({ meeting }) => meetingId.value === meeting)
  )

  /**
   * Ordered groups in this meeting, annotated with members (user pks) and membership objects.
   */
  const orderedGroups = computed(() => {
    return sortBy(_meetingGroups.value, 'title').map((g) => {
      const memberships = filter(
        groupMemberships.values(),
        // eslint-disable-next-line camelcase
        ({ meeting_group }) => g.pk === meeting_group
      )
      const members = memberships.map((m) => m.user)
      return {
        ...g,
        members,
        memberships
      }
    })
  })

  /**
   * Ordered, annotated groups in current meeting that current user is member of.
   */
  const userGroups = computed(() => orderedGroups.value.filter(isGroupMember))

  /**
   * Ordered, annotated groups in current meeting that current user can post as.
   */
  const postAsGroups = computed(() =>
    isModerator.value
      ? orderedGroups.value
      : orderedGroups.value.filter((g) => isGroupMember(g) && g.post_as)
  )

  return {
    allGroupMembers,
    canChangeMeeting: computed(() => {
      const meeting = meetings.get(meetingId.value)
      if (!meeting) return false
      return canChangeMeeting(meeting)
    }),
    canPostAs,
    groupRoles: roles,
    meetingGroups: orderedGroups,
    memberCount,
    postAsGroups,
    voteCount,
    userGroups,
    getMeetingGroup
  }
}
