<script setup lang="ts">
import { shallowReactive, watch } from 'vue'

interface Settings {
  allow_random: boolean
}

const props = defineProps<{
  modelValue: Settings
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Settings): void
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
