import { any, ifilter, imap, type Primitive, reduce, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'

import { titleSorter } from '@/utils'
import { PickByType } from '@/utils/types'
import useAuthStore from '../auth/useAuthStore'

import { meetingType } from './contentTypes'
import { Meeting, MeetingState } from './types'

type MeetingSortKeys = keyof PickByType<Meeting, Primitive | undefined | null>

const MAIN_PAGE_MEETING_STATES: MeetingState[] = [
  MeetingState.Closed,
  MeetingState.Ongoing,
  MeetingState.Upcoming
]

export default defineStore('meetings', () => {
  const meetings = reactive(new Map<number, Meeting>())
  const meetingRoles = meetingType.useContextRoles()

  meetingType.updateMap(meetings)

  const authStore = useAuthStore()

  function getMeeting(meeting: number) {
    return meetings.get(meeting)
  }

  /**
   * Get filtered and ordered list of meetings
   */
  function filterMeetings(
    states: MeetingState[],
    order: MeetingSortKeys,
    search: string,
    year: number | null
  ) {
    return sorted(
      ifilter(
        meetings.values(),
        (m) =>
          states.includes(m.state) &&
          m.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
          (!year ||
            (!!m.start_time && new Date(m.start_time).getFullYear() === year))
      ),
      (m) => m[order] ?? ''
    )
  }

  /**
   * Get filtered and ordered list of meetings in a specific state
   */
  function getMeetingList(
    state: MeetingState,
    order: MeetingSortKeys | typeof titleSorter = titleSorter,
    reverse?: boolean
  ) {
    const keyFn =
      typeof order === 'string' ? (m: Meeting) => m[order] ?? '' : order
    return sorted(
      ifilter(
        meetings.values(),
        (m) => m.state === state && !!m.current_user_roles?.length
      ),
      keyFn,
      reverse
    )
  }

  const participatingClosedMeetings = computed(() =>
    getMeetingList(MeetingState.Closed, 'end_time', true)
  )
  const participatingOngoingMeetings = computed(() =>
    getMeetingList(MeetingState.Ongoing)
  )
  const participatingUpcomingMeetings = computed(() =>
    getMeetingList(MeetingState.Upcoming)
  )

  /**
   * For no visible meetings info (closed, ongoing, upcoming)
   */
  const hasVisibleMeetings = computed(() =>
    any(meetings.values(), (m) => MAIN_PAGE_MEETING_STATES.includes(m.state))
  )

  /**
   * For other meetings button (not closed, ongoing, upcoming)
   */
  const hasHiddenMeetings = computed(() =>
    any(meetings.values(), (m) => !MAIN_PAGE_MEETING_STATES.includes(m.state))
  )

  /**
   * List of years from meeting list
   */
  const existingMeetingYears = computed(() => {
    return sorted(
      new Set(
        ifilter(
          imap(
            meetings.values(),
            (m) => m.start_time && new Date(m.start_time).getFullYear()
          ),
          (v) => typeof v === 'number'
        )
      )
    ) as number[]
  })

  function setMeeting(meeting: Meeting) {
    meetings.set(meeting.pk, meeting)
    if (meeting.current_user_roles && authStore.user)
      meetingRoles.set(
        meeting.pk,
        authStore.user.pk,
        meeting.current_user_roles
      )
  }

  function clearMeetings() {
    meetings.clear()
  }

  /**
   * Try to fetch a meeting. Resolves to boolean, representing user meeting access.
   *
   * @returns true: User currently has meeting role(s)
   */
  async function fetchMeeting(pk: number) {
    const { data } = await meetingType.api.retrieve(pk)
    setMeeting(data)
    return !!data.current_user_roles
  }

  async function fetchMeetings() {
    const { data } = await meetingType.api.list()
    for (const m of data) meetings.set(m.pk, m)
  }

  const stateCount = computed(() =>
    reduce(
      meetings.values(),
      (acc, m) => {
        acc[m.state] = (acc[m.state] ?? 0) + 1
        return acc
      },
      {} as Partial<Record<MeetingState, number>>
    )
  )

  return {
    existingMeetingYears,
    hasHiddenMeetings,
    hasVisibleMeetings,
    stateCount,
    participatingClosedMeetings,
    participatingOngoingMeetings,
    participatingUpcomingMeetings,
    clearMeetings,
    fetchMeeting,
    fetchMeetings,
    filterMeetings,
    getMeeting,
    getMeetingList,
    setMeeting
  }
})
