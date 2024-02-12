<template>
  <v-dialog
    v-model="isActive"
    :persistent="persistent"
    :height="height"
    :width="width"
  >
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs"></slot>
    </template>
    <template #default="attrs">
      <v-sheet class="pa-4" :color="color">
        <div v-if="title || persistent" class="d-flex mb-4">
          <h2 v-if="title" class="flex-grow-1">
            {{ title }}
          </h2>
          <v-spacer v-else />
          <v-btn
            v-if="!persistent"
            class="mt-n2 mr-n2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="close"
          />
        </div>
        <slot v-bind="attrs" :close="close"></slot>
      </v-sheet>
    </template>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

import { Color } from '@/utils/types'

const emit = defineEmits(['close', 'open', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    color?: Color
    height?: string | number
    modelValue?: boolean
    persistent?: boolean
    title?: string
    width?: string
  }>(),
  {
    width: '640px'
  }
)

const isActive = ref(props.modelValue)

function close() {
  isActive.value = false
}

watch(isActive, (value) => {
  emit(value ? 'open' : 'close')
  emit('update:modelValue', value)
})
watch(
  () => props.modelValue,
  (value) => {
    isActive.value = value
  }
)
</script>
