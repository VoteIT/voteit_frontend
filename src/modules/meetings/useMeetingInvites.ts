import { ref, readonly } from 'vue'
import { meetingInviteType } from './contentTypes'
import { MeetingInvite } from './types'

const meetingInvites = ref<MeetingInvite[]>([])

export default function useMeetingInvites () {
  async function fetchInvites () {
    const { data } = await meetingInviteType.api.list()
    meetingInvites.value = data
  }

  function clearInvites () {
    meetingInvites.value = []
  }

  return {
    meetingInvites: readonly(meetingInvites),
    clearInvites,
    fetchInvites
  }
}
