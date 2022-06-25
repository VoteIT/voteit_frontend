import useAuthentication from '@/composables/useAuthentication'
import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'
import { meetingGroupType } from './contentTypes'
import { canChangeMeeting } from './rules'
import { MeetingGroup } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'

const meetingGroups = reactive<Map<number, MeetingGroup>>(new Map())

meetingGroupType.updateMap(meetingGroups)

function * iterGroups (filter: (group: MeetingGroup) => boolean) {
  for (const group of meetingGroups.values()) {
    if (filter(group)) yield group
  }
}

const { meetings } = useMeetings()

export default function useMeetingGroups (meetingId: Ref<number>) {
  const { user } = useAuthentication()
  const { isModerator } = useMeeting() // Waning: If meetingId above differs from useMeeting computed meetingId, we get the wrong value. This is inconsequential.

  const userGroups = computed(() => {
    return orderBy([...iterGroups(
      group => group.meeting === meetingId.value && (isModerator.value || (!!user.value && group.members.includes(user.value.pk)))
    )], ['title'])
  })

  const canPostAs = computed(() => isModerator.value || userGroups.value.length)

  return {
    canChangeMeeting: computed(() => {
      const meeting = meetings.get(meetingId.value)
      if (!meeting) return false
      return canChangeMeeting(meeting)
    }),
    canPostAs,
    getMeetingGroup (pk: number) {
      return meetingGroups.get(pk)
    },
    meetingGroups: computed(() => {
      return orderBy([...iterGroups(
        group => group.meeting === meetingId.value
      )], ['title'])
    }),
    userGroups
  }
}
