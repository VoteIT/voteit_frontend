import { any, filter, ifilter, imap, Predicate, sorted, sum } from 'itertools'
import { sortBy } from 'lodash'
import { computed, MaybeRef, reactive, unref } from 'vue'

import { titleSorter } from '@/utils'
import useAuthStore from '../auth/useAuthStore'

import {
  groupMembershipType,
  groupRoleType,
  meetingGroupType
} from './contentTypes'
import { canChangeMeeting, isModerator } from './rules'
import { GroupMembership, GroupRole, MeetingGroup } from './types'
import useMeetingStore from './useMeetingStore'

const meetingGroups = reactive(new Map<number, MeetingGroup>())
meetingGroupType.updateMap(meetingGroups, { meeting: 'meeting' })

const groupRoles = reactive(new Map<number, GroupRole>())
groupRoleType.updateMap(groupRoles)

const groupMemberships = reactive(new Map<number, GroupMembership>())
groupMembershipType.updateMap(groupMemberships, { meeting: 'm' })

export function getMeetingGroup(pk: number) {
  return meetingGroups.get(pk)
}

export function getGroupRole(role: number) {
  return groupRoles.get(role)
}

export function isGroupMember(group: number, user: number) {
  return any(
    groupMemberships.values(),
    (gm) => gm.meeting_group === group && gm.user === user
  )
}

export default function useMeetingGroups(meetingId: MaybeRef<number>) {
  const authStore = useAuthStore()
  const { getMeeting } = useMeetingStore()

  function isGroupMember(
    group: (typeof orderedGroups)['value'][number]
  ): boolean {
    return group.memberships.some(
      (membership) => membership.user === authStore.user?.pk
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
    sum(imap(allGroupMembers.value, (m) => m.votes ?? 0))
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

  function filterGroups(
    predicate: Predicate<MeetingGroup & { memberships: GroupMembership[] }>
  ) {
    return sorted(
      ifilter(
        imap(meetingGroups.values(), (g) => ({
          ...g,
          memberships: filter(
            groupMemberships.values(),
            (m) => m.meeting_group === g.pk
          )
        })),
        (g) => g.meeting === unref(meetingId) && predicate(g)
      ),
      (g) => g.title.toLocaleLowerCase()
    )
  }

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
      const meeting = getMeeting(unref(meetingId))
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
    filterGroups,
    getMeetingGroup,
    getRole(pk: number) {
      return roles.value.find((r) => r.pk === pk)
    }
  }
}
