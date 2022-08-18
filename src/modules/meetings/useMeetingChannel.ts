import { onBeforeMount, computed } from 'vue'

import useMeeting from './useMeeting'
import { useRouter } from 'vue-router'
import useLoader from '@/composables/useLoader'
import useMeetings from './useMeetings'
import useChannel from '@/composables/useChannel'

const loader = useLoader('useMeetingChannel')

const channelConfig = { timeout: 15_000, critical: true } // Use long timeout for meeting channel subscription, so people don't get thrown out.

export default function useMeetingChannel () {
  const { isModerator, meetingId, meeting, meetingJoinPath } = useMeeting()
  const { fetchMeeting } = useMeetings()
  const router = useRouter()

  const roleChannel = computed(() => {
    if (!meeting.value) return
    if (isModerator.value === undefined) return
    return isModerator.value ? 'moderators' : 'participants'
  })

  useChannel('meeting', meetingId, channelConfig)
  useChannel(roleChannel, meetingId, { ...channelConfig, leaveDelay: 500 })

  onBeforeMount(() => {
    loader.call(async () => {
      try {
        if (!await fetchMeeting(meetingId.value)) await router.push(meetingJoinPath.value)
      } catch {
        await router.push('/')
        loader.reset()
      }
    })
  })
}
