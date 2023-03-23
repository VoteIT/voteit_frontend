<template>
  <Proposal v-for="p in proposals" :key="p.pk" :p="p" class="mb-4">
    <template #buttons>
      <component v-for="{ component }, i in plugins" :key="i" :is="component" :proposal="p" />
    </template>
  </Proposal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import useMeeting from '../meetings/useMeeting'

import { proposalButtonPlugins } from './registry'
import type { Proposal } from './types'

defineProps<{ proposals: Proposal[] }>()

const { meeting } = useMeeting()

const plugins = computed(() => meeting.value ? proposalButtonPlugins.getActivePlugins(meeting.value) : [])
</script>
