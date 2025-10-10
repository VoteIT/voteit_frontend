<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import useRules from '@/composables/useRules'
import type { RepeatedIRVPoll } from './types'

const props = defineProps<{
  modelValue: RepeatedIRVPoll['settings']
  proposals: number
}>()

const initialValue = { min: props.modelValue.min, max: props.modelValue.max }

const emit = defineEmits<{
  (e: 'update:modelValue', value: RepeatedIRVPoll['settings']): void
}>()

const { t } = useI18n()
const { max, min, required } = useRules(t)
const { smAndUp } = useDisplay()

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))

const hint = computed(() => {
  if (settings.min === props.proposals) return t('poll.IRV.limitAll')
  if ((settings.max || props.proposals) === settings.min)
    return t('poll.IRV.limitExact', { ...settings }, settings.min)
  if (!settings.max)
    return t('poll.IRV.limitMin', { ...settings }, settings.min || 1)
  return t('poll.IRV.limitRange', { ...settings })
})

function setRange([min, max]: [number, number]) {
  settings.min = min
  settings.max = max === props.proposals ? 0 : max
}

function resetSlider() {
  Object.assign(settings, initialValue)
}
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
  <v-label v-if="!smAndUp" :text="$t('poll.IRV.rangeLimit')" />
  <v-range-slider
    :label="smAndUp ? $t('poll.IRV.rangeLimit') : undefined"
    :max="proposals"
    :hint="hint"
    min="1"
    persistent-hint
    show-ticks="always"
    step="1"
    :model-value="[settings.min || 1, settings.max || proposals]"
    @update:model-value="setRange"
  >
    <template #append>
      <v-btn
        :disabled="
          settings.min === initialValue.min && settings.max === initialValue.max
        "
        icon="mdi-undo"
        size="small"
        :text="$t('reset')"
        variant="tonal"
        @click="resetSlider"
      />
    </template>
  </v-range-slider>
</template>
