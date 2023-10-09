<template>
  <v-tooltip :disabled="!button.description" :text="button.description" location="top center">
    <template #activator="{ props }">
      <v-btn
        v-if="modelValue || !disabled"
        v-bind="{ ...props, ...$attrs }"
        size="small"
        :color="modelValue ? button.color : 'secondary'"
        :disabled="disabled"
        :prepend-icon="button.icon"
        :variant="variant"
        @click.prevent="emit('update:modelValue', !modelValue)"
      >
        {{ button.title }}
      </v-btn>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { IFlagButton } from './types'

const props = defineProps<{
  button: IFlagButton
  disabled?: boolean
  modelValue?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'listOpen'])

const variant = computed(() => {
  return props.modelValue
    ? 'flat'
    : 'tonal'
})
</script>
