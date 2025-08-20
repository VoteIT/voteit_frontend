import { any, filter } from 'itertools'
import { sortBy } from 'lodash'
import { computed, MaybeRef, reactive, unref } from 'vue'

import { titleSorter } from '@/utils'
import useAuthentication from '@/composables/useAuthentication'

import {
  groupMembershipType,
  groupRoleType,
  meetingGroupType
} from './contentTypes'
import { canChangeMeeting, isModerator } from './rules'
import { GroupMembership, GroupRole, MeetingGroup } from './types'
import useMeetings from './useMeetings'

const meetingGroups = reactive(new Map<number, MeetingGroup>())
meetingGroupType.updateMap(meetingGroups, { meeting: 'meeting' })

const groupRoles = reactive(new Map<number, GroupRole>())
groupRoleType.updateMap(groupRoles)

const groupMemberships = reactive(new Map<number, GroupMembership>())
groupMembershipType.updateMap(groupMemberships, { meeting: 'm' })

const { meetings } = useMeetings()

export function getMeetingGroup(pk: number) {
  return meetingGroups.get(pk)
}

export function isGroupMember(group: number, user: number) {
  return any(
    groupMemberships.values(),
    (gm) => gm.meeting_group === group && gm.user === user
  )
}

export default function useMeetingGroups(meetingId: MaybeRef<number>) {
  const { user } = useAuthentication()

  function isGroupMember(
    group: (typeof orderedGroups)['value'][number]
  ): boolean {
    return group.memberships.some(
      (membership) => membership.user === user.value?.pk
    )
  }

  const _meetingGroups = computed(() =>
    filter(
      meetingGroups.values(),
      (group) => group.meeting === unref(meetingId)
    )
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
  const canPostAs = computed(
    () => isModerator(unref(meetingId)) || userGroups.value.length
  )
  const roles = computed(() => {
    const meeting = unref(meetingId)
    return filter(groupRoles.values(), (g) => g.meeting === meeting)
  })

  /**
   * Ordered groups in this meeting, annotated with members (user pks) and membership objects.
   */
  const orderedGroups = computed(() => {
    return sortBy(_meetingGroups.value, titleSorter).map((g) => {
      const memberships = filter(
        groupMemberships.values(),
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
    isModerator(unref(meetingId))
      ? orderedGroups.value
      : orderedGroups.value.filter((g) => isGroupMember(g) && g.post_as)
  )

  return {
    allGroupMembers,
    canChangeMeeting: computed(() => {
      const meeting = meetings.get(unref(meetingId))
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
    getMeetingGroup,
    getRole(pk: number) {
      return roles.value.find((r) => r.pk === pk)
    }
  }
}
