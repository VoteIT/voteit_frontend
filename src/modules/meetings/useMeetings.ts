import { filter, ifilter, imap } from 'itertools'
import { countBy, isNumber, sortBy } from 'lodash'
import { computed, onBeforeMount, reactive, watch } from 'vue'

import useAuthentication, { user } from '@/composables/useAuthentication'
import type { LoaderCallback } from '@/composables/useLoader'

import { meetingType } from './contentTypes'
import { Meeting, MeetingRole, MeetingState } from './types'

const MEETING_ROLE_ICONS: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.updateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

const { isAuthenticated } = useAuthentication()

function getMeetingList (state: MeetingState, order: keyof Meeting = 'title') {
  return sortBy(
    filter(
      meetings.values(),
      m => m.state === state && !!m.current_user_roles && !!m.current_user_roles.length
    ),
    order
  )
}

function getMeetingRoleIcon (role: MeetingRole) {
  return MEETING_ROLE_ICONS[role]
}

function filterMeetings (states: MeetingState[], order: keyof Meeting, search: string, year: number | null) {
  return sortBy(
    filter(
      meetings.values(),
      m => (
        states.includes(m.state) &&
        m.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (!year || (!!m.start_time && new Date(m.start_time).getFullYear() === year))
      )
    ),
    order
  )
}

const participatingClosedMeetings = computed(() => getMeetingList(MeetingState.Closed))
const participatingOngoingMeetings = computed(() => getMeetingList(MeetingState.Ongoing))
const participatingUpcomingMeetings = computed(() => getMeetingList(MeetingState.Upcoming))
const otherMeetingsExist = computed(() => meetings.size > (participatingOngoingMeetings.value.length + participatingUpcomingMeetings.value.length))
const existingMeetingYears = computed(() => {
  return sortBy(
    [...new Set(
      ifilter(
        imap(meetings.values(), m => m.start_time && new Date(m.start_time).getFullYear()),
        isNumber
      )
    )] as number[]
  )
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

const meetingStateCount = computed(() => countBy([...meetings.values()], 'state') as Partial<Record<MeetingState, number>>)

export default function useMeetings (loader?: (...callbacks: LoaderCallback[]) => void) {
  if (loader) {
    onBeforeMount(() => {
      if (isAuthenticated.value) loader(fetchMeetings)
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
    meetingStateCount,
    otherMeetingsExist,
    participatingClosedMeetings,
    participatingOngoingMeetings,
    participatingUpcomingMeetings,
    fetchMeeting,
    fetchMeetings,
    filterMeetings,
    getMeetingRoleIcon,
    clearMeetings
  }
}
