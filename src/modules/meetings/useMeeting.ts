import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { slugify, restApi, mapFilter, mapFind } from '@/utils'

import useAuthentication from '../../composables/useAuthentication'
import { meetings } from './useMeetings'

import { MeetingRoles } from '../../composables/types'
import { Meeting, MeetingRole } from './types'
import { canChangeMeeting, canChangeRolesMeeting, canAddMeetingInvite, canViewMeetingInvite } from './rules'
import { meetingType } from './contentTypes'
import { User } from '../organisations/types'
import { useI18n } from 'vue-i18n'

const FORCE_ROLES_FETCH = false

const participants = ref<Map<number, MeetingRoles>>(new Map())

const pFetchQueue = new Set<number>()
let pFetchTimeout: number

export default function useMeeting () {
  const route = useRoute()
  const meetingRoles = meetingType.useContextRoles()
  const { user } = useAuthentication()
  const { t } = useI18n()

  function getRoleLabels (filter: (k: string) => boolean = () => true) {
    return Object.fromEntries(
      Object.values(MeetingRole)
        .filter(filter)
        .map(role => [role, t(`meeting.role.${role}`)])
    )
  }

  const roleLabels = computed(() => getRoleLabels())

  interface UserListParams {
    context: number
    // eslint-disable-next-line camelcase
    user_id_in?: string
  }

  async function fetchParticipants (meeting: number, userIds: Set<number> | number[]) {
    // Fetch all or specified participants (rest)
    // If specific, checks if already fetched
    meeting = meeting || meetingId.value
    const params: UserListParams = { context: meeting }
    if (userIds) {
      userIds = [...new Set(userIds)] // Reduce to unique values
      if (!FORCE_ROLES_FETCH) {
        // Skip userid's already in store
        const existingUserIds = new Set([
          ...mapFilter(participants.value, p => p.meeting === meeting)
        ].map(p => p.user.pk))
        userIds = userIds.filter(pk => !existingUserIds.has(pk))
        if (userIds.length === 0) {
          return Promise.resolve()
        }
        params.user_id_in = userIds.join(',')
      }
    }
    const { data } = await restApi.get<MeetingRoles[]>('meeting-roles/', { params })
    data.forEach(p => {
      meetingRoles.set(meeting, p.user.pk, p.assigned)
      participants.value.set(p.pk, p)
    })
  }

  function fetchParticipant (user: number, meeting: number, timeout = 50) {
    // Avoid getting participants in several requests by queing, and setting a short timeout.
    if (!pFetchQueue.has(user)) {
      pFetchQueue.add(user)
      clearTimeout(pFetchTimeout)
      pFetchTimeout = setTimeout(() => {
        fetchParticipants(meeting, pFetchQueue)
        pFetchQueue.clear()
      }, timeout)
    }
  }

  function getUser (pk?: number, meeting?: number): User | undefined {
    // Return user object if found in meeting participants
    // Otherwise queue for fetch
    meeting = meeting ?? meetingId.value
    pk = pk ?? user.value?.pk
    if (typeof pk !== 'number') return
    const role = mapFind(participants.value, r => r.user.pk === pk && r.meeting === meeting)
    if (role) {
      return role.user
    }
    // No data, queue participant for fetch and return nothing for now
    fetchParticipant(pk, meeting)
  }

  function getParticipants (meeting: number) {
    // Return all participants in meeting
    return [...mapFilter(participants.value, r => r.meeting === meeting)]
  }

  const meetingId = computed(() => Number(route.params.id))
  const meeting = computed<Meeting | undefined>(() => meetings.get(meetingId.value)) // Disable fallback || {})
  const meetingPath = computed(() => `/m/${meetingId.value}/${slugify(meeting.value ? meeting.value.title : '-')}`)

  const userRoles = computed(() => meetingRoles.getUserRoles(meetingId.value))
  function hasRole (role: MeetingRole, user?: number) {
    return meetingRoles.hasRole(meetingId.value, role, user)
  }
  const isModerator = computed(() => hasRole(MeetingRole.Moderator))
  const canChange = computed(() => canChangeMeeting(meeting.value))
  const canChangeRoles = computed(() => meeting.value && canChangeRolesMeeting(meeting.value))

  return {
    canChange,
    canChangeRoles,
    canAddMeetingInvite: computed(() => meeting.value && canAddMeetingInvite(meeting.value)),
    canViewMeetingInvite: computed(() => meeting.value && canViewMeetingInvite(meeting.value)),
    isModerator,
    meetingId,
    meeting,
    meetingPath,
    roleLabels,
    userRoles,
    getRoleLabels,
    getUser,
    hasRole,
    fetchParticipants,
    getParticipants
  }
}
