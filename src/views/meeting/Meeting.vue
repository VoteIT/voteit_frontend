<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, provide, watch } from 'vue'

import Bubbles from '@/components/meeting/Bubbles.vue'
import PresenceCheck from '@/components/meeting/bubbles/PresenceCheck.vue'

import useBubbles from '@/composables/meeting/useBubbles'
import useMeeting from '@/modules/meetings/useMeeting'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import usePresence from '@/composables/meeting/usePresence'

import { BubbleComponent } from '@/components/meeting/bubbles/types'

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
