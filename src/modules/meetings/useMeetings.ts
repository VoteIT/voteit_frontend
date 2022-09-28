import { orderBy } from 'lodash'
import { computed, onBeforeMount, reactive, watch } from 'vue'

import useAuthentication, { user } from '@/composables/useAuthentication'
import type { LoaderCallback } from '@/composables/useLoader'

import { meetingType } from './contentTypes'
import { Meeting, MeetingState } from './types'
import { dateify, mapFilter } from '@/utils'

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.updateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

const { isAuthenticated } = useAuthentication()

function getMeetingList (state: MeetingState, order: keyof Meeting = 'title') {
  return orderBy(
    [...mapFilter(
      meetings,
      m => m.state === state && !!m.current_user_roles
    )],
    [order]
  )
}

function filterMeetings (states: MeetingState[], order: keyof Meeting, search: string, year: number | null) {
  return orderBy(
    [...mapFilter(
      meetings,
      m => states.includes(m.state) && m.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!year || m.start_time?.getFullYear() === year)
    )],
    [order]
  )
}

export default function useMeetings (loader?: (...callbacks: LoaderCallback[]) => void) {
  const participatingClosedMeetings = computed(() => getMeetingList(MeetingState.Closed))
  const participatingOngoingMeetings = computed(() => getMeetingList(MeetingState.Ongoing))
  const participatingUpcomingMeetings = computed(() => getMeetingList(MeetingState.Upcoming))
  const otherMeetingsExist = computed(() => meetings.size > (participatingOngoingMeetings.value.length + participatingUpcomingMeetings.value.length))
  const existingMeetingYears = computed(() => [...new Set([...meetings.values()].map(m => m.start_time?.getFullYear()))])

  function setMeeting (meeting: Meeting) {
    meetings.set(meeting.pk, meeting)
    if (meeting.current_user_roles && user.value) {
      meetingRoles.set(meeting.pk, user.value.pk, meeting.current_user_roles)
    }
  }

  async function fetchMeeting (pk: number) {
    const { data } = await meetingType.api.retrieve(pk)
    setMeeting(dateify(data, ['created', 'start_time', 'end_time']))
    return !!data.current_user_roles
  }

  async function fetchMeetings () {
    const { data } = await meetingType.api.list()
    for (const m of data) {
      meetings.set(m.pk, dateify(m, ['created', 'start_time', 'end_time']))
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
    existingMeetingYears,
    otherMeetingsExist,
    participatingClosedMeetings,
    participatingOngoingMeetings,
    participatingUpcomingMeetings,
    fetchMeeting,
    fetchMeetings,
    filterMeetings,
    clearMeetings
  }
}
