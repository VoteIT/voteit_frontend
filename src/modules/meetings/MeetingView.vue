<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, provide, watch } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'
import PresenceCheck from '@/contentTypes/presenceCheck/PresenceCheckBubble.vue'

import useBubbles from '@/modules/meetings/useBubbles'
import useMeeting from '@/modules/meetings/useMeeting'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import usePresence from '@/modules/presence/usePresence'

import { BubbleComponent } from '@/modules/meetings/types'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { meetingId, hasRole } = useMeeting()
    useMeetingChannel(true)

    const presence = usePresence()
    const presenceBubble = useBubbles(PresenceCheck as BubbleComponent)

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

    provide('hasRole', hasRole)
  },
  components: {
    Bubbles
  }
})
</script>
