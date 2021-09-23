import { computed, reactive } from 'vue'

import meetingType from '@/contentTypes/meeting'
import { Meeting } from '@/contentTypes/types'
import { orderBy } from '@/utils'
import { user } from '@/composables/useAuthentication'

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.getChannel()
  .updateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

export default function useMeetings () {
  const meetingApi = meetingType.getContentApi()

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
    const { data } = await meetingApi.retrieve(pk)
    setMeeting(data)
    return !!data.current_user_roles
  }

  async function fetchMeetings () {
    const { data } = await meetingApi.list()
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
