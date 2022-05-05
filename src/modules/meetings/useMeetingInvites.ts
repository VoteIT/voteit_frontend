import { readonly, reactive, computed, ref, Ref } from 'vue'
import { matchedInviteType, meetingInviteType } from './contentTypes'
import { MeetingInvite } from './types'

const meetingInvites = reactive<Map<number, MeetingInvite>>(new Map())
const userMeetingInvites = ref<MeetingInvite[]>([])

meetingInviteType.updateMap(meetingInvites)

export default function useMeetingInvites (meetingId?: Ref<number>) {
  async function fetchInvites () {
    try {
      /* For user from rest API */
      const { data } = await matchedInviteType.api.list()
      userMeetingInvites.value = data
    } catch {
      // TODO
    }
  }

  function clearInvites () {
    /* For user from rest API */
    userMeetingInvites.value = []
  }

  return {
    userMeetingInvites: readonly(userMeetingInvites),
    meetingInvites: computed(() => {
      if (!meetingId) return []
      return [...meetingInvites.values()]
        .filter(invite => invite.meeting === meetingId.value)
    }),
    clearInvites,
    fetchInvites
  }
}
