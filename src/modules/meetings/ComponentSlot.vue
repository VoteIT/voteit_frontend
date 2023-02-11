<template>
  <component
    v-for="{ component, id } in components" :key="id"
    :is="component"
  />
  <slot v-if="!components.length"></slot>
</template>

<script lang="ts" setup>
import { filter } from 'itertools'
import { computed } from 'vue'

import { meetingSlotPlugins } from './registry'
import useMeeting from './useMeeting'

const { meeting } = useMeeting()

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const components = computed(() => {
  return filter(
    meeting.value ? meetingSlotPlugins.getActivePlugins(meeting.value) : [],
    plugin => plugin.slot === props.name
  )
})
</script>
