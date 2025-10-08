<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import type { RepeatedIRVSettings } from './types'

const props = defineProps<{
  modelValue: RepeatedIRVSettings
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RepeatedIRVSettings): void
}>()

const { t } = useI18n()
const { max, min, required } = useRules(t)

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))

const maxContraints = computed(() => [
  max(props.proposals),
  min(Math.max(0, settings.min || 0))
])

const minContraints = computed(() => [
  max(Math.min(props.proposals, settings.max || 1_000)),
  min(0),
  required
])
</script>

<template>
  <v-text-field
    :label="$t('winners')"
    :max="proposals"
    min="2"
    :rules="[max(proposals), min(2), required]"
    type="number"
    v-model="settings.winners"
  />
  <v-checkbox
    hide-details
    :label="$t('poll.allowRandomTiebreaker')"
    v-model="settings.allow_random"
  />
  <v-text-field
    :label="$t('poll.minRanked')"
    :max="proposals"
    min="1"
    :rules="minContraints"
    type="number"
    :modelValue="settings.min"
    @update:model-value="settings.min = Number($event)"
  />
  <v-text-field
    :hint="$t('poll.dutt.minMaxHint')"
    :label="$t('poll.maxRanked')"
    :max="proposals"
    min="0"
    :rules="maxContraints"
    type="number"
    :modelValue="settings.max"
    @update:model-value="settings.max = Number($event)"
  />
</template>
