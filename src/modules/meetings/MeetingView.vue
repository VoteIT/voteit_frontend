<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, provide, watch } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'
import PresenceCheck from '@/modules/presence/PresenceCheckBubble.vue'

import useBubbles from '@/modules/meetings/useBubbles'
import useMeeting from '@/modules/meetings/useMeeting'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import usePresence from '@/modules/presence/usePresence'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './useElectoralRegisters'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { meetingId } = useMeeting()
    const { clearRegisters } = useElectoralRegisters()
    useMeetingChannel(true)
    provide(LastReadKey, null)

    const presence = usePresence()
    const presenceBubble = useBubbles(PresenceCheck)

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
    onBeforeUnmount(clearRegisters)
    watch(isPresent, checkIsPresent)
  },
  components: {
    Bubbles
  }
})
</script>
