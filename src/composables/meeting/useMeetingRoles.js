import { ref } from 'vue'
import wu from 'wu'

import { restApi } from '@/utils'

import useMeeting from './useMeeting'

const FORCE_ROLES_FETCH = false

const meetingRoles = ref(new Map())

export default function useMeetingRoles () {
  const { meetingId } = useMeeting()

  function getUser (userId) {
    const role = wu(meetingRoles.value.values())
      .find(r => r.user.pk === userId && r.meeting === meetingId.value)
    if (role) {
      return role.user
    }
    return {}
  }

  function getMeetingRoles (meetingId) {
    return [...wu(meetingRoles.value.values())
      .filter(r => r.meeting === meetingId)]
  }

  function setRoles (roles) {
    roles.forEach(r => {
      meetingRoles.value.set(r.pk, r)
    })
  }

  async function fetchMeetingRoles (meetingId, userIds) {
    const params = { context: meetingId }
    if (userIds) {
      userIds = [...new Set(userIds)] // Reduce to unique values
      if (!FORCE_ROLES_FETCH) {
        // Skip userid's already in store
        const meetingRoles = getMeetingRoles(meetingId)
        userIds = userIds.filter(pk => !meetingRoles.some(r => r.user.pk === pk))
        if (userIds.length > 0) {
          params.user_id_in = userIds.join(',')
        }
      }
    }
    restApi.get('meeting-roles/', { params })
      .then(({ data }) => {
        setRoles(data)
      })
  }

  return {
    fetchMeetingRoles,
    setRoles,
    getMeetingRoles,
    getUser
  }
}
