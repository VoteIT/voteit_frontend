import { watch, onBeforeMount, onBeforeUnmount, computed } from 'vue'

import Channel from '@/contentTypes/Channel'
import useMeeting from './useMeeting'
import { useRouter } from 'vue-router'
import useLoader from '@/composables/useLoader'
import { slugify } from '@/utils'
import useMeetings from './useMeetings'
import { meetingType } from './contentTypes'

const loader = useLoader('useMeetingChannel')

let currentRoleChannel: Channel | null = null
const channelConfig = { timeout: 15_000 } // Use long timeout for meeting channel subscription, so people don't get thrown out.

export default function useMeetingChannel (init = false) {
  const { isModerator, meetingId, meeting } = useMeeting()
  const { fetchMeeting } = useMeetings()
  const router = useRouter()

  function leaveRoleChannel () {
    if (!currentRoleChannel) return
    currentRoleChannel.leave(meetingId.value, { leaveDelay: 500 })
    currentRoleChannel = null
  }
  const roleChannel = computed(() => isModerator.value ? 'moderators' : 'participants')

  async function enterRoleChannel () {
    if (!meetingId.value || roleChannel.value === currentRoleChannel?.name) return
    leaveRoleChannel()
    currentRoleChannel = meetingType.getChannel(roleChannel.value, channelConfig)
    await currentRoleChannel.subscribe(meetingId.value)
  }

  if (init) {
    watch(roleChannel, enterRoleChannel)

    onBeforeMount(() => {
      loader.call(async () => {
        try {
          if (await fetchMeeting(meetingId.value)) enterRoleChannel()
          else await router.push(`/join/${meetingId.value}/${slugify(meeting.value?.title ?? '-')}`)
        } catch {
          await router.push('/')
          loader.reset()
        }
      })
      loader.subscribe(meetingType.channel, meetingId.value)
    })
    onBeforeUnmount(() => {
      meetingType.channel.leave(meetingId.value)
      leaveRoleChannel()
    })
  }
}
