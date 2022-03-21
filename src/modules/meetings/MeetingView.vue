<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, provide } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'
// import PresenceCheckBubble from '@/modules/presence/PresenceCheckBubble.vue'
// import UnvotedPollsBubble from '@/modules/polls/UnvotedPollsBubble.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './useElectoralRegisters'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { clearRegisters } = useElectoralRegisters()
    useMeetingChannel()
    provide(LastReadKey, null)
    provide('context', 'meeting')

    onBeforeUnmount(clearRegisters)
  },
  components: {
    Bubbles
  }
})
</script>
