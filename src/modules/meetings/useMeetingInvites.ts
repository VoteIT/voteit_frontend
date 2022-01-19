import Channel from '@/contentTypes/Channel'
import { readonly, reactive, computed, ref, Ref } from 'vue'
import { meetingInviteType } from './contentTypes'
import { MeetingInvite } from './types'

const meetingInvites = reactive<Map<number, MeetingInvite>>(new Map())
const userMeetingInvites = ref<MeetingInvite[]>([])

new Channel('meeting_invite')
  .updateMap(meetingInvites)

export default function useMeetingInvites (meetingId?: Ref<number>) {
  async function fetchInvites () {
    /* For user from rest API */
    const { data } = await meetingInviteType.api.list()
    userMeetingInvites.value = data
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
