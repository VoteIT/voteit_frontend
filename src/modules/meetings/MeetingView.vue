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

import { RoleContextKey } from '@/injectionKeys'
import Bubbles from '@/modules/meetings/Bubbles.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import usePermission, { PermissionDeniedStrategy } from '@/composables/usePermission'
import useMeeting from './useMeeting'

const { canViewMeeting } = useMeeting()
const { isLoaded, fetchFailed } = useMeetingChannel()

const viewPermission = computed(() => !fetchFailed.value && canViewMeeting.value)

usePermission(viewPermission, undefined, PermissionDeniedStrategy.RequireLogin)

provide(RoleContextKey, 'meeting')
</script>
