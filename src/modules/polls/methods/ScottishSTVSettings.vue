<script setup lang="ts">
import { shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ScottishSTVPoll } from './types'

const props = defineProps<{
  modelValue: ScottishSTVPoll['settings']
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ScottishSTVPoll['settings']): void
}>()

const { t } = useI18n()

function multipleWinners(value: number) {
  return value > 1 || t('poll.STV.requireMultipleWinners')
}

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))
</script>

<template>
  <v-slider
    :label="$t('winners')"
    :max="proposals - 1"
    min="1"
    :rules="[multipleWinners]"
    step="1"
    v-model="settings.winners"
  >
    <template #append>
      <v-avatar color="secondary" :text="settings.winners.toString()" />
    </template>
  </v-slider>
  <v-checkbox
    hide-details
    :label="$t('poll.allowRandomTiebreaker')"
    v-model="settings.allow_random"
  />
</template>
