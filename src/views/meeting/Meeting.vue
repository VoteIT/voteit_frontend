<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, provide, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import { slugify } from '@/utils'

import Bubbles from '@/components/meeting/Bubbles.vue'
import PresenceCheck from '@/components/meeting/bubbles/PresenceCheck.vue'

import useAuthentication from '@/composables/useAuthentication'
import useBubbles from '@/composables/meeting/useBubbles'
import Channel from '@/contentTypes/Channel'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'
import usePolls from '@/composables/meeting/usePolls'
import usePresence from '@/composables/meeting/usePresence'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import meetingType from '@/contentTypes/meeting'
import { BubbleComponent } from '@/components/meeting/bubbles/types'
import { MeetingRole } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { t } = useI18n()
    const loader = useLoader('Meeting')
    const router = useRouter()
    const { meeting, meetingId, meetingPath, setMeeting, meetingApi, hasRole } = useMeeting()
    const channel = meetingType.getChannel()
    const { user } = useAuthentication()

    const presence = usePresence()
    const presenceBubble = useBubbles(PresenceCheck as BubbleComponent)

    const speakers = useSpeakerLists()

    const presenceCheck = computed(() => presence.getOpenPresenceCheck(meetingId.value))
    const isPresent = computed(() => presenceCheck.value && !!presence.getUserPresence(presenceCheck.value.pk))

    function checkIsPresent (value?: boolean) {
      // Can be false, true or undefined.
      switch (value) {
        case false:
          // Presence check, user not present
          presenceBubble.activate({ presenceCheck })
          break
        case true:
          // Presence check, user present
          presenceBubble.activate({ presenceCheck }, { open: false }) // Make sure bubble is active when presence check active. (app state)
          presenceBubble.close() // If user interaction, close bubble window
          break
        case undefined:
          // No presence check
          presenceBubble.remove()
          break
      }
    }

    onMounted(() => checkIsPresent(isPresent.value))
    watch(isPresent, checkIsPresent)

    const { getPolls } = usePolls()
    const polls = computed(() => getPolls(meetingId.value))
    const ongoingPollCount = computed(() => getPolls(meetingId.value, 'ongoing').length)

    const channels = new Channel() // For dynamic usage
    const isModerator = computed(() => hasRole(MeetingRole.Moderator))
    let currentRoleChannel: string | null = null
    async function leaveRoleChannel () {
      if (!currentRoleChannel) return
      await channels.leave(currentRoleChannel, { leaveDelay: 0 })
      currentRoleChannel = null
    }
    async function enterRoleChannel () {
      if (!meetingId.value) return
      const channelName = `${isModerator.value ? 'moderators' : 'participants'}/${meetingId.value}`
      if (channelName === currentRoleChannel) return
      await leaveRoleChannel()
      currentRoleChannel = channelName
      await channels.subscribe(channelName)
    }
    watch(isModerator, enterRoleChannel)

    onBeforeMount(() => {
      loader.call(async () => {
        try {
          const { data } = await meetingApi.retrieve(meetingId.value)
          if (!data.current_user_roles) {
            router.push(`/join/${meetingId.value}/${slugify(meeting.value ? meeting.value.title : '-')}`)
            return
          }
          setMeeting(data)
          await enterRoleChannel()
        } catch {
          router.push('/')
        }
      })
      loader.subscribe(channel, meetingId.value)
    })
    onBeforeRouteLeave(() => {
      channel.leave(meetingId.value)
      leaveRoleChannel()
    })

    provide('hasRole', hasRole)

    return {
      meeting,
      meetingId,
      meetingPath,
      polls,
      ongoingPollCount,
      channel,
      speakers,
      t,
      user,
      hasRole
    }
  },
  components: {
    Bubbles
  }
})
</script>
