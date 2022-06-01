<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, provide } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import usePermission from '@/composables/usePermission'
import useMeeting from './useMeeting'

export default defineComponent({
  name: 'Meeting',
  setup () {
    const { meetingId, canViewMeeting } = useMeeting()
    const { clearRegisters } = useElectoralRegisters(meetingId)
    useMeetingChannel()
    usePermission(canViewMeeting)
    provide(LastReadKey, null)
    provide('context', 'meeting')

    onBeforeUnmount(clearRegisters)
  },
  components: {
    Bubbles
  }
})
</script>
