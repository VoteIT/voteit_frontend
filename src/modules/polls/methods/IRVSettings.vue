<script setup lang="ts">
import { shallowReactive, watch } from 'vue'

import { InstantRunoffPoll } from './types'

const props = defineProps<{
  modelValue: InstantRunoffPoll['settings']
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: InstantRunoffPoll['settings']): void
}>()

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))
</script>

<template>
  <v-checkbox
    hide-details
    :label="$t('poll.allowRandomTiebreaker')"
    v-model="settings.allow_random"
  />
</template>
