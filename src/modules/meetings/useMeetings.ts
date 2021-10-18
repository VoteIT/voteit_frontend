import { computed, reactive } from 'vue'

import { orderBy } from '@/utils'
import { user } from '@/composables/useAuthentication'
import { meetingType } from './contentTypes'
import { Meeting } from './types'

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.channelUpdateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

export default function useMeetings () {
  const orderedMeetings = computed(() => {
    return orderBy([...meetings.values()], 'title')
  })

  function setMeeting (meeting: Meeting) {
    meetings.set(meeting.pk, meeting)
    if (meeting.current_user_roles && user.value) {
      meetingRoles.set(meeting.pk, user.value.pk, meeting.current_user_roles)
    }
  }

  async function fetchMeeting (pk: number) {
    const { data } = await meetingType.api.retrieve(pk)
    setMeeting(data)
    return !!data.current_user_roles
  }

  async function fetchMeetings () {
    const { data } = await meetingType.api.list()
    for (const m of data) {
      meetings.set(m.pk, m)
    }
  }

  function clearMeetings () {
    meetings.clear()
  }

  return {
    meetings,
    fetchMeeting,
    fetchMeetings,
    clearMeetings,
    orderedMeetings
  }
}
