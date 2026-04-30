import { Predicate } from 'itertools'
import { computed, MaybeRef, unref } from 'vue'

import useGroupStore from './useGroupStore'
import { GroupMembership, MeetingGroup } from './types'
import { canChangeMeeting, isModerator } from './rules'
import useMeetingStore from './useMeetingStore'

export default function useMeetingGroups(meetingId: MaybeRef<number>) {
  const groupStore = useGroupStore()
  const { getMeeting } = useMeetingStore()

  const postAsGroups = computed(() =>
    groupStore.getPostAsGroups(
      unref(meetingId),
      !!isModerator(unref(meetingId))
    )
  )

  return {
    allGroupMembers: computed(() =>
      groupStore.getAllGroupMembers(unref(meetingId))
    ),
    canChangeMeeting: computed(() => {
      const meeting = getMeeting(unref(meetingId))
      return meeting ? canChangeMeeting(meeting) : false
    }),
    canPostAs: computed(
      () => isModerator(unref(meetingId)) || postAsGroups.value.length > 0
    ),
    groupRoles: computed(() => [...groupStore.getGroupRoles(unref(meetingId))]),
    meetingGroups: computed(() =>
      groupStore.filterGroups((g) => g.meeting === unref(meetingId))
    ),
    memberCount: computed(() => groupStore.getMemberCount(unref(meetingId))),
    postAsGroups,
    voteCount: computed(() => groupStore.getVoteCount(unref(meetingId))),
    userGroups: computed(() => groupStore.getUserGroups(unref(meetingId))),
    filterGroups(
      predicate: Predicate<
        MeetingGroup & { memberships: GroupMembership[]; members: number[] }
      >
    ) {
      return groupStore.filterGroups(
        (g) => g.meeting === unref(meetingId) && predicate(g)
      )
    }
  }
}
