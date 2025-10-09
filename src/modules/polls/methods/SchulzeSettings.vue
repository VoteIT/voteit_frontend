<script setup lang="ts">
import { shallowReactive, watch } from 'vue'

interface Settings {
  deny_proposal: boolean
  stars: number
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
  <v-slider
    :label="$t('poll.schulze.numberOfStars')"
    hide-details
    min="3"
    max="20"
    step="1"
    v-model="settings.stars"
  >
    <template #append>
      <v-avatar color="secondary" :text="settings.stars.toString()" />
    </template>
  </v-slider>
  <v-checkbox
    :disabled="proposals === 2"
    hide-details
    :label="$t('poll.schulze.addDenyProposal')"
    v-model="settings.deny_proposal"
  />
</template>
