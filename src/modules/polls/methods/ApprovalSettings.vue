<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import type { DuttSettings } from './types'

const props = defineProps<{
  modelValue: DuttSettings
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DuttSettings): void
}>()

const { t } = useI18n()
const { max, min, required } = useRules(t)

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))

const maxContraints = computed(() => [
  max(props.proposals - 1),
  min(Math.max(0, settings.min || 0))
])

const minContraints = computed(() => [
  max(Math.min(props.proposals - 1, settings.max || 1_000)),
  min(1),
  required
])
</script>

<template>
  <v-text-field
    :label="$t('poll.dutt.min')"
    :max="proposals - 1"
    min="1"
    :rules="minContraints"
    type="number"
    :modelValue="settings.min"
    @update:model-value="settings.min = Number($event)"
  />
  <v-text-field
    :hint="$t('poll.dutt.minMaxHint')"
    :label="$t('poll.dutt.max')"
    :max="proposals - 1"
    min="0"
    :rules="maxContraints"
    type="number"
    :modelValue="settings.max"
    @update:model-value="settings.max = Number($event)"
  />
</template>
