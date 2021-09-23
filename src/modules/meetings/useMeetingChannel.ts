import { watch, onBeforeMount, onBeforeUnmount } from 'vue'

import Channel from '@/contentTypes/Channel'
import meetingType from '@/contentTypes/meeting'
import useMeeting from './useMeeting'
import { useRouter } from 'vue-router'
import useLoader from '@/composables/useLoader'
import { slugify } from '@/utils'
import useMeetings from './useMeetings'

const loader = useLoader('useMeetingChannels')

let currentRoleChannel: string | null = null
const channel = meetingType.getChannel()
const channels = new Channel() // For dynamic usage

function leaveRoleChannel () {
  if (!currentRoleChannel) return
  channels.leave(currentRoleChannel, { leaveDelay: 500 })
  currentRoleChannel = null
}

export default function useMeetingChannel (init = false) {
  const { isModerator, meetingId, meeting } = useMeeting()
  const { fetchMeeting } = useMeetings()
  const router = useRouter()

  async function enterRoleChannel () {
    if (!meetingId.value) return
    const channelName = `${isModerator.value ? 'moderators' : 'participants'}/${meetingId.value}`
    if (channelName === currentRoleChannel) return
    leaveRoleChannel()
    currentRoleChannel = channelName
    await channels.subscribe(channelName)
  }

  if (init) {
    watch(isModerator, enterRoleChannel)

    onBeforeMount(() => {
      loader.call(async () => {
        try {
          if (await fetchMeeting(meetingId.value)) await enterRoleChannel()
          else await router.push(`/join/${meetingId.value}/${slugify(meeting.value?.title ?? '-')}`)
        } catch {
          await router.push('/')
        }
      })
      loader.subscribe(channel, meetingId.value)
    })
    onBeforeUnmount(() => {
      channel.leave(meetingId.value)
      leaveRoleChannel()
    })
  }
}
