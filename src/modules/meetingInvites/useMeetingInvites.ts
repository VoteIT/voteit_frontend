import { computed, MaybeRef, unref } from 'vue'

import useInviteStore from './useInviteStore'

export default function useMeetingInvites(meeting: MaybeRef<number>) {
  const store = useInviteStore()

  return {
    meetingInvites: computed(() => {
      const meetingId = unref(meeting)
      return [...store.meetingInvites.values()].filter(
        (invite) => invite.meeting === meetingId
      )
    })
  }
}
