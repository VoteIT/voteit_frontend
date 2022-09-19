import { orderBy } from 'lodash'
import { computed, onBeforeMount, reactive, watch } from 'vue'

import useAuthentication, { user } from '@/composables/useAuthentication'
import type { LoaderCallback } from '@/composables/useLoader'

import { meetingType } from './contentTypes'
import { Meeting } from './types'

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.updateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

const { isAuthenticated } = useAuthentication()

export default function useMeetings (loader?: (...callbacks: LoaderCallback[]) => void) {
  const orderedMeetings = computed(() => {
    return orderBy([...meetings.values()], ['title'])
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

  if (loader) {
    onBeforeMount(() => {
      if (isAuthenticated) loader(fetchMeetings)
    })
    // User could be logged in/out or switched directly. Always clear meetings first.
    watch(user, value => {
      clearMeetings()
      if (value) {
        fetchMeetings()
      }
    })
  }

  return {
    meetings,
    fetchMeeting,
    fetchMeetings,
    clearMeetings,
    orderedMeetings
  }
}
