import { onBeforeMount, computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import useChannel from '@/composables/useChannel'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'

const channelConfig = { timeout: 15_000, critical: true } // Use long timeout for meeting channel subscription, so people don't get thrown out.

export default function useMeetingChannel() {
  const { isModerator, meetingId, meeting, meetingJoinRoute } = useMeeting()
  const { fetchMeeting } = useMeetings()
  const router = useRouter()

  const fetchFailed = ref(false)

  const roleChannel = computed(() => {
    if (!meeting.value) return
    if (isModerator.value === undefined) return
    return isModerator.value ? 'moderators' : 'participants'
  })

  const channels = [
    useChannel('meeting', meetingId, channelConfig),
    useChannel(roleChannel, meetingId, { ...channelConfig, leaveDelay: 500 })
  ]

  const loader = useLoader(
    'useMeetingChannel',
    ...channels.map((ch) => ch.promise)
  )

  onBeforeMount(() => {
    loader.call(async () => {
      try {
        if (!(await fetchMeeting(meetingId.value)))
          await router.push(meetingJoinRoute.value)
      } catch {
        fetchFailed.value = true
        // await router.push({ name: 'home' })
        // loader.reset()
      }
    })
  })

  const isLoaded = computed(
    () => !!meeting.value && channels.every((ch) => ch.isSubscribed.value)
  )

  return {
    isLoaded,
    fetchFailed
  }
}
