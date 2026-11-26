<template>
  <v-tooltip
    :disabled="!button.description"
    :text="button.description"
    location="top center"
  >
    <template #activator="{ props }">
      <span v-bind="props">
        <v-btn
          v-if="model || !readonly"
          v-bind="$attrs"
          :color="button.color"
          :loading="working"
          :prepend-icon="button.icon"
          :readonly="readonly"
          size="small"
          :text="button.title"
          :variant="variant"
          @click.prevent="!readonly && (model = !model)"
        />
      </span>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { IFlagButton } from './types'

defineProps<{
  button: IFlagButton
  readonly?: boolean
  working?: boolean
}>()

defineEmits(['listOpen'])

const model = defineModel<boolean>()

const variant = computed(() => {
  return model.value ? 'flat' : 'tonal'
})
</script>
