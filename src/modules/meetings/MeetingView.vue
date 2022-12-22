<template>
  <router-view />
  <Bubbles />
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, provide } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import { LastReadKey } from '@/composables/useUnread'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import usePermission from '@/composables/usePermission'
import useMeeting from './useMeeting'
import { meetingIdKey } from './injectionKeys'

const props = defineProps({
  meetingId: {
    type: Number,
    required: true
  }
})

const meetingId = computed(() => props.meetingId)
const { canViewMeeting } = useMeeting()
const { clearRegisters } = useElectoralRegisters(meetingId)
useMeetingChannel()
usePermission(canViewMeeting)
provide(LastReadKey, null)
provide('context', 'meeting')
provide(meetingIdKey, meetingId)

onBeforeUnmount(clearRegisters)
</script>
