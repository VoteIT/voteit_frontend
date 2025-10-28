import { filter, ifilter, imap } from 'itertools'
import { countBy, isNumber, orderBy, sortBy } from 'lodash'
import { computed, onBeforeMount, reactive, watch } from 'vue'

import { titleSorter } from '@/utils'
import type { LoaderCallback } from '@/composables/useLoader'

import { meetingType } from './contentTypes'
import { Meeting, MeetingRole, MeetingState } from './types'
import useAuthStore from '../auth/useAuthStore'

export const roleIcons: Record<MeetingRole, string> = {
  [MeetingRole.Participant]: 'mdi-eye',
  [MeetingRole.Moderator]: 'mdi-gavel',
  [MeetingRole.Proposer]: 'mdi-note-plus',
  [MeetingRole.Discusser]: 'mdi-comment-outline',
  [MeetingRole.PotentialVoter]: 'mdi-star-outline'
}
export function getMeetingRoleIcon(role: MeetingRole) {
  return roleIcons[role]
}

export const meetings = reactive(new Map<number, Meeting>())

meetingType.updateMap(meetings)

const meetingRoles = meetingType.useContextRoles()

function getMeetingList(
  state: MeetingState,
  order: keyof Meeting | typeof titleSorter = titleSorter,
  direction: 'asc' | 'desc' = 'asc'
) {
  return orderBy(
    filter(
      meetings.values(),
      (m) =>
        m.state === state &&
        !!m.current_user_roles &&
        !!m.current_user_roles.length
    ),
    order,
    direction
  )
}

function filterMeetings(
  states: MeetingState[],
  order: keyof Meeting,
  search: string,
  year: number | null
) {
  return sortBy(
    filter(
      meetings.values(),
      (m) =>
        states.includes(m.state) &&
        m.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (!year ||
          (!!m.start_time && new Date(m.start_time).getFullYear() === year))
    ),
    order
  )
}

const participatingClosedMeetings = computed(() =>
  getMeetingList(MeetingState.Closed, 'end_time', 'desc')
)
const participatingOngoingMeetings = computed(() =>
  getMeetingList(MeetingState.Ongoing)
)
const participatingUpcomingMeetings = computed(() =>
  getMeetingList(MeetingState.Upcoming)
)
const otherMeetingsExist = computed(
  () =>
    meetings.size >
    participatingOngoingMeetings.value.length +
      participatingUpcomingMeetings.value.length
)
const existingMeetingYears = computed(() => {
  return sortBy([
    ...new Set(
      ifilter(
        imap(
          meetings.values(),
          (m) => m.start_time && new Date(m.start_time).getFullYear()
        ),
        isNumber
      )
    )
  ] as number[])
})

function setMeeting(meeting: Meeting) {
  const { user } = useAuthStore()
  meetings.set(meeting.pk, meeting)
  if (meeting.current_user_roles && user)
    meetingRoles.set(meeting.pk, user.pk, meeting.current_user_roles)
}

/**
 * Try to fetch a meeting. Resolves to boolean, representing user meeting access.
 *
 * true: User currently has meeting role(s)
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

function clearMeetings() {
  meetings.clear()
}

const meetingStateCount = computed(
  () =>
    countBy([...meetings.values()], 'state') as Partial<
      Record<MeetingState, number>
    >
)

export default function useMeetings(
  loader?: (...callbacks: LoaderCallback[]) => void
) {
  if (loader) {
    const authStore = useAuthStore()
    onBeforeMount(() => {
      if (authStore.isAuthenticated) loader(fetchMeetings)
    })
    // User could be logged in/out or switched directly. Always clear meetings first.
    watch(
      () => authStore.user,
      (value) => {
        clearMeetings()
        if (value) fetchMeetings()
      }
    )
  }

  return {
    existingMeetingYears,
    meetingStateCount,
    meetings,
    otherMeetingsExist,
    participatingClosedMeetings,
    participatingOngoingMeetings,
    participatingUpcomingMeetings,
    roleIcons,
    clearMeetings,
    fetchMeeting,
    fetchMeetings,
    filterMeetings,
    getMeetingRoleIcon
  }
}
