<script setup lang="ts">
import { shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import type { ScottishSTVSettings as Settings } from './types'

const props = defineProps<{
  modelValue: Settings
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Settings): void
}>()

const { t } = useI18n()
const { required, max, min } = useRules(t)

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))
</script>

<template>
  <v-text-field
    :label="$t('winners')"
    :max="proposals - 1"
    min="2"
    :rules="[max(proposals - 1), min(2), required]"
    type="number"
    v-model="settings.winners"
  />
  <v-checkbox
    hide-details
    :label="$t('poll.allowRandomTiebreaker')"
    v-model="settings.allow_random"
  />
</template>
