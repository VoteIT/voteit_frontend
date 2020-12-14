import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { slugify } from '@/utils'

import useRestApi from '../useRestApi.js'
import useMeetings from '../useMeetings.js'
import useAgenda from './useAgenda.js'

export default function useMeeting () {
  const route = useRoute()
  const { restApi } = useRestApi()
  const { meetings } = useMeetings()
  const { setAgenda } = useAgenda()

  function setMeeting (meeting) {
    meetings.value.set(meeting.pk, meeting)
    if (meeting.agenda_items) {
      setAgenda(meeting.pk, meeting.agenda_items)
    }
  }

  async function fetchMeeting (id) {
    id = id || meetingId.value
    return restApi.get(`meetings/${id}/`)
      .then(({ data }) => { setMeeting(data) })
  }

  const meetingId = computed(_ => Number(route.params.id))
  const meeting = computed(_ => meetings.value.get(meetingId.value) || {})
  const meetingPath = computed(_ => `/m/${meetingId.value}/${slugify(meeting.value.title)}`)

  const userRoles = computed(_ => meeting.value.current_user_roles || [])
  function hasRole (roleName) {
    if (typeof roleName === 'string') {
      return userRoles.value.includes(roleName)
    } else if (roleName && typeof roleName.some === 'function') {
      return roleName.some(r => userRoles.value.includes(r))
    } else if (roleName === undefined) {
      return true
    }
  }

  return {
    meetingId,
    meeting,
    meetingPath,
    userRoles,
    hasRole,
    fetchMeeting
  }
}
