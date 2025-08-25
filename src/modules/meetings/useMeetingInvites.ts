import { reactive, computed, MaybeRef, unref } from 'vue'

import { meetingInviteType } from './contentTypes'
import { MeetingInvite } from './types'

const meetingInvites = reactive<Map<number, MeetingInvite>>(new Map())

meetingInviteType.updateMap(meetingInvites)

export default function useMeetingInvites(meeting: MaybeRef<number>) {
  return {
    meetingInvites: computed(() => {
      const meetingId = unref(meeting)
      return [...meetingInvites.values()].filter(
        (invite) => invite.meeting === meetingId
      )
    })
  }
}
