<template>
  <template v-if="isLoaded">
    <router-view />
    <Bubbles />
  </template>
  <div v-else class="my-8 text-center">
    <v-progress-circular indeterminate />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue'

import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import usePermission from '@/composables/usePermission'
import useMeeting from './useMeeting'
import { meetingIdKey } from './injectionKeys'

const props = defineProps<{ meetingId: number }>()

const meetingId = computed(() => props.meetingId)
const { canViewMeeting } = useMeeting()
const { isLoaded } = useMeetingChannel()

usePermission(canViewMeeting)
provide('context', 'meeting')
provide(meetingIdKey, meetingId)
</script>
