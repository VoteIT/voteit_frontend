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
import { provide } from 'vue'

import { RoleContextKey } from '@/injectionKeys'
import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import usePermission from '@/composables/usePermission'
import useMeeting from './useMeeting'

const { canViewMeeting } = useMeeting()
const { isLoaded } = useMeetingChannel()

usePermission(canViewMeeting)

provide(RoleContextKey, 'meeting')
</script>
