<template>
  <v-tooltip
    :disabled="!button.description"
    :text="button.description"
    location="top center"
  >
    <template #activator="{ props }">
      <span v-bind="props">
        <v-btn
          v-if="modelValue || !disabled"
          v-bind="$attrs"
          :color="button.color"
          :disabled="disabled"
          :loading="working"
          :prepend-icon="button.icon"
          size="small"
          :text="button.title"
          :variant="variant"
          @click.prevent="emit('update:modelValue', !modelValue)"
        />
      </span>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { IFlagButton } from './types'

const props = defineProps<{
  button: IFlagButton
  disabled?: boolean
  working?: boolean
  modelValue?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'listOpen'])

const variant = computed(() => {
  return props.modelValue ? 'flat' : 'tonal'
})
</script>
