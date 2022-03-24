import useAuthentication from '@/composables/useAuthentication'
import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'
import { meetingGroupType } from './contentTypes'
import { canChangeMeeting } from './rules'
import { MeetingGroup } from './types'
import useMeetings from './useMeetings'

const meetingGroups = reactive<Map<number, MeetingGroup>>(new Map())

meetingGroupType.updateMap(meetingGroups)

function * iterGroups (filter: (group: MeetingGroup) => boolean) {
  for (const group of meetingGroups.values()) {
    if (filter(group)) yield group
  }
}

export default function useGroups (meetingId: Ref<number>) {
  const { user } = useAuthentication()
  const { meetings } = useMeetings()
  return {
    canChangeMeeting: computed(() => {
      const meeting = meetings.get(meetingId.value)
      if (!meeting) return false
      return canChangeMeeting(meeting)
    }),
    getMeetingGroup (pk: number) {
      return meetingGroups.get(pk)
    },
    meetingGroups: computed(() => {
      return orderBy([...iterGroups(
        group => group.meeting === meetingId.value
      )], ['title'])
    }),
    userGroups: computed(() => {
      return orderBy([...iterGroups(
        group => group.meeting === meetingId.value && !!user.value && group.members.includes(user.value.pk)
      )], ['title'])
    })
  }
}
