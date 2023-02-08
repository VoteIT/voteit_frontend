import useAuthentication from '@/composables/useAuthentication'
import { filter, first } from 'itertools'
import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'
import { groupMembershipType, groupRoleType, meetingGroupType } from './contentTypes'
import { canChangeMeeting } from './rules'
import { GroupMembership, GroupRole, MeetingGroup } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'

const meetingGroups = reactive(new Map<number, MeetingGroup>())
meetingGroupType.updateMap(meetingGroups)

const groupRoles = reactive(new Map<number, GroupRole>())
groupRoleType.updateMap(groupRoles)

const groupMemberships = reactive(new Map<number, GroupMembership>())
groupMembershipType.updateMap(groupMemberships)

function getMeetingGroup (pk: number) {
  return meetingGroups.get(pk)
}

const { meetings } = useMeetings()

export default function useMeetingGroups (meetingId: Ref<number>) {
  const { user } = useAuthentication()
  const { isModerator } = useMeeting() // Warning: If meetingId above differs from useMeeting computed meetingId, we get the wrong value. This is inconsequential.

  /**
   * Groups that current user is member of.
   */
  const userGroups = computed(() => {
    return orderBy(
      filter(
        meetingGroups.values(),
        group => group.meeting === meetingId.value && (isModerator.value || (!!user.value && !!first(groupMemberships.values(), g => g.user === user.value?.pk)))
      ),
      ['title']
    )
  })

  const canPostAs = computed(() => isModerator.value || userGroups.value.length)
  const roles = computed(() => filter(groupRoles.values(), ({ meeting }) => meetingId.value === meeting))

  /**
   * Ordered groups in this meeting, annotated with members (user pks) and membership objects.
   */
  const orderedGroups = computed(() => {
    return orderBy(
      filter(
        meetingGroups.values(),
        group => group.meeting === meetingId.value
      ),
      ['title']
    )
      .map(g => {
        const memberships = filter(
          groupMemberships.values(),
          // eslint-disable-next-line camelcase
          ({ meeting_group }) => g.pk === meeting_group
        )
        const members = memberships.map(m => m.user)
        return {
          ...g,
          members,
          memberships
        }
      })
  })

  return {
    canChangeMeeting: computed(() => {
      const meeting = meetings.get(meetingId.value)
      if (!meeting) return false
      return canChangeMeeting(meeting)
    }),
    canPostAs,
    groupRoles: roles,
    meetingGroups: orderedGroups,
    userGroups,
    getMeetingGroup
  }
}
