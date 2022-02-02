<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, provide, watch } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'
import PresenceCheckBubble from '@/modules/presence/PresenceCheckBubble.vue'
import UnvotedPollsBubble from '@/modules/polls/UnvotedPollsBubble.vue'

import useBubble from '@/modules/meetings/useBubble'
import useMeeting from '@/modules/meetings/useMeeting'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import usePresence from '@/modules/presence/usePresence'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './useElectoralRegisters'
import usePolls from '../polls/usePolls'
import { BubbleComponent } from './types'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { meetingId } = useMeeting()
    const { clearRegisters } = useElectoralRegisters()
    useMeetingChannel()
    provide(LastReadKey, null)

    /* Presence check bubble */
    const presence = usePresence()
    const presenceBubble = useBubble(PresenceCheckBubble as any as BubbleComponent)

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
    watch(isPresent, checkIsPresent)

    /* Voting bubble */
    const { getNextUnvotedPoll } = usePolls()
    const hasUnvoted = computed(() => !!getNextUnvotedPoll(meetingId.value))
    const unvotedBubble = useBubble(UnvotedPollsBubble as any as BubbleComponent)
    function checkHasUnvoted (value: boolean) {
      if (value) unvotedBubble.activate({})
      else unvotedBubble.remove()
    }
    watch(hasUnvoted, checkHasUnvoted)

    onMounted(() => {
      checkIsPresent(isPresent.value)
      checkHasUnvoted(hasUnvoted.value)
    })
    onBeforeUnmount(clearRegisters)
  },
  components: {
    Bubbles
  }
})
</script>
