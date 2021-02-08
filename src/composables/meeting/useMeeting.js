import wu from 'wu'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { slugify, restApi } from '@/utils'

import useContextRoles from '../useContextRoles.js'
import useAuthentication from '../useAuthentication.js'
import useMeetings from '../useMeetings.js'

const FORCE_ROLES_FETCH = false

const participants = ref(new Map())

const pFetchQueue = new Set()
let pFetchTimeout = null

export default function useMeeting () {
  const route = useRoute()
  const { meetings } = useMeetings()
  const meetingRoles = useContextRoles('Meeting')
  const { user } = useAuthentication()

  function setMeeting (meeting) {
    meetings.value.set(meeting.pk, meeting)
  }

  async function fetchParticipants (pk, userIds) {
    // Fetch all or specified participants (rest)
    // If specific, checks if already fetched
    pk = pk || meetingId.value
    const params = { context: pk }
    if (userIds) {
      userIds = [...new Set(userIds)] // Reduce to unique values
      if (!FORCE_ROLES_FETCH) {
        // Skip userid's already in store
        const existingUserIds = new Set(wu(participants.value.values())
          .filter(p => p.meeting === pk)
          .map(p => p.user.pk))
        userIds = userIds.filter(pk => !existingUserIds.has(pk))
        if (userIds.length === 0) {
          return Promise.resolve()
        }
        params.user_id_in = userIds.join(',')
      }
    }
    return restApi.get('meeting-roles/', { params })
      .then(({ data }) => {
        data.forEach(p => {
          meetingRoles.set(pk, p.user.pk, p.assigned)
          participants.value.set(p.pk, p)
        })
      })
  }

  function fetchParticipant (userPk, meetingPk, timeout = 50) {
    // Avoid getting participants in several requests by queing, and setting a short timeout.
    if (!pFetchQueue.has(userPk)) {
      pFetchQueue.add(userPk)
      clearTimeout(pFetchTimeout)
      pFetchTimeout = setTimeout(_ => {
        fetchParticipants(meetingPk, pFetchQueue)
        pFetchQueue.clear()
      }, timeout)
    }
  }

  function getUser (pk, meetingPk) {
    // Return user object if found in meeting participants
    // Otherwise queue for fetch
    meetingPk = meetingPk || meetingId.value
    const role = wu(participants.value.values())
      .find(r => r.user.pk === pk && r.meeting === meetingPk)
    if (role) {
      return role.user
    }
    // No data, queue participant for fetch and return empty object for now
    fetchParticipant(pk, meetingPk)
    return {}
  }

  function getParticipants (pk) {
    // Return all participants in meeting
    return [...wu(participants.value.values())
      .filter(r => r.meeting === pk)]
  }

  async function fetchMeeting (pk) {
    pk = pk || meetingId.value
    return restApi.get(`meetings/${pk}/`)
      .then(({ data }) => {
        setMeeting(data)
        meetingRoles.set(pk, user.value.pk, data.current_user_roles)
      })
  }

  const meetingId = computed(_ => Number(route.params.id))
  const meeting = computed(_ => meetings.value.get(meetingId.value) || {})
  const meetingPath = computed(_ => `/m/${meetingId.value}/${slugify(meeting.value.title)}`)

  const userRoles = computed(_ => meetingRoles.getUserRoles(meetingId.value))
  function hasRole (roleName, userId) {
    return meetingRoles.hasRole(meetingId.value, roleName, userId)
  }

  return {
    meetingId,
    meeting,
    meetingPath,
    userRoles,
    getUser,
    hasRole,
    fetchMeeting,
    fetchParticipants,
    getParticipants
  }
}
