import { any, filter, ifilter, imap, Predicate, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import useAuthStore from '../auth/useAuthStore'
import {
  groupMembershipType,
  groupRoleType,
  meetingGroupType
} from './contentTypes'
import { GroupMembership, GroupRole, MeetingGroup } from './types'

export default defineStore('groups', () => {
  const meetingGroups = reactive(new Map<number, MeetingGroup>())
  const groupRoles = reactive(new Map<number, GroupRole>())
  const groupMemberships = reactive(new Map<number, GroupMembership>())

  meetingGroupType.updateMap(meetingGroups, { meeting: 'meeting' })
  groupRoleType.updateMap(groupRoles)
  groupMembershipType.updateMap(groupMemberships, { meeting: 'm' })

  function getMeetingGroup(pk: number) {
    return meetingGroups.get(pk)
  }

  function getGroupRole(pk: number) {
    return groupRoles.get(pk)
  }

  function isGroupMember(group: number, user: number) {
    return any(
      groupMemberships.values(),
      (gm) => gm.meeting_group === group && gm.user === user
    )
  }

  function getMembershipsForGroup(groupPk: number): GroupMembership[] {
    return filter(groupMemberships.values(), (m) => m.meeting_group === groupPk)
  }

  function getGroupRoles(meetingId: number) {
    return filter(groupRoles.values(), (r) => r.meeting === meetingId)
  }

  function filterGroups(
    predicate: Predicate<
      MeetingGroup & { memberships: GroupMembership[]; members: number[] }
    >
  ) {
    return sorted(
      ifilter(
        imap(meetingGroups.values(), (g) => {
          const memberships = getMembershipsForGroup(g.pk)
          return {
            ...g,
            members: memberships.map((m) => m.user),
            memberships
          }
        }),
        predicate
      ),
      (g) => g.title.toLocaleLowerCase()
    )
  }

  function getMemberCount(meetingId: number) {
    let count = 0
    for (const m of groupMemberships.values())
      if (meetingGroups.get(m.meeting_group)?.meeting === meetingId) count++
    return count
  }

  function getVoteCount(meetingId: number) {
    let votes = 0
    for (const m of groupMemberships.values())
      if (meetingGroups.get(m.meeting_group)?.meeting === meetingId)
        votes += m.votes ?? 0
    return votes
  }

  function getUserGroups(meetingId: number) {
    const userPk = useAuthStore().user?.pk
    if (!userPk) return []
    return filterGroups(
      (g) =>
        g.meeting === meetingId && g.memberships.some((m) => m.user === userPk)
    )
  }

  function getPostAsGroups(meetingId: number, isModerator: boolean) {
    if (isModerator) return filterGroups((g) => g.meeting === meetingId)
    const userPk = useAuthStore().user?.pk
    return filterGroups(
      (g) => g.post_as && g.memberships.some((m) => m.user === userPk)
    )
  }

  function getAllGroupMembers(meetingId: number) {
    return filter(
      groupMemberships.values(),
      (m) => meetingGroups.get(m.meeting_group)?.meeting === meetingId
    )
  }

  return {
    filterGroups,
    getAllGroupMembers,
    getMeetingGroup,
    getMemberCount,
    getGroupRole,
    getGroupRoles,
    getPostAsGroups,
    getVoteCount,
    getUserGroups,
    isGroupMember
  }
})
