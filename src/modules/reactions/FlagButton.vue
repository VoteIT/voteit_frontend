<template>
  <span class="text-no-wrap" v-if="modelValue || !disabled">
    <v-btn :prepend-icon="button.icon" size="small" :variant="variant" :color="modelValue ? button.color : 'secondary'" :disabled="disabled" @click.prevent="emit('update:modelValue', !modelValue)">
      {{ button.title }}
    </v-btn>
  </span>
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
