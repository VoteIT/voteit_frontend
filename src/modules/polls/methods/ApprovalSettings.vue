<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import type { DuttSettings } from './types'

const props = defineProps<{
  modelValue: DuttSettings
  proposals: number
}>()

const initialValue = { ...props.modelValue }

const emit = defineEmits<{
  (e: 'update:modelValue', value: DuttSettings): void
}>()

const { t } = useI18n()
const { smAndUp } = useDisplay()

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))

function notAll([min]: [number, number]) {
  return min !== props.proposals || t('poll.dutt.cantRequireAll')
}

const hint = computed(() => {
  if ((settings.max || props.proposals) === settings.min)
    return t('poll.dutt.limitExact', { ...settings }, settings.min)
  if (!settings.max)
    return t('poll.dutt.limitMin', { ...settings }, settings.min)
  return t('poll.dutt.limitRange', { ...settings })
})

function resetSlider() {
  Object.assign(settings, initialValue)
}

function setRange([min, max]: [number, number]) {
  settings.min = min
  settings.max = max === props.proposals ? 0 : max
}
</script>

<template>
  <v-label v-if="!smAndUp" :text="$t('poll.dutt.rangeLimit')" />
  <v-range-slider
    :label="smAndUp ? $t('poll.dutt.rangeLimit') : undefined"
    :max="proposals"
    :hint="hint"
    min="1"
    persistent-hint
    :rules="[notAll]"
    show-ticks="always"
    step="1"
    :model-value="[settings.min, settings.max || proposals]"
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
