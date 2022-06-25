<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, provide } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import usePermission from '@/composables/usePermission'
import useMeeting from './useMeeting'
import { meetingIdKey } from './injectionKeys'

export default defineComponent({
  props: {
    meetingId: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const meetingId = computed(() => props.meetingId)
    const { canViewMeeting } = useMeeting()
    const { clearRegisters } = useElectoralRegisters(meetingId)
    useMeetingChannel()
    usePermission(canViewMeeting)
    provide(LastReadKey, null)
    provide('context', 'meeting')
    provide(meetingIdKey, meetingId)

    onBeforeUnmount(clearRegisters)
  },
  components: {
    Bubbles
  }
})
</script>
