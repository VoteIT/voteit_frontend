<template>
  <v-dialog v-model="isActive" v-bind="dialogDefaults">
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs" />
    </template>
    <template #default="attrs">
      <v-sheet class="pa-4">
        <div class="d-flex mb-4">
          <h2 class="flex-grow-1">
            {{ title }}
          </h2>
          <v-btn
            v-if="!noCloser"
            class="mt-n2 mr-n2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="isActive = false"
          />
        </div>
        <slot v-bind="attrs" />
      </v-sheet>
    </template>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

import useDefaults from '@/composables/useDefaults'

const { dialogDefaults } = useDefaults()

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: Boolean,
  noCloser: Boolean,
  title: {
    type: String,
    required: true
  }
})

const isActive = ref(props.modelValue)
watch(isActive, value => emit('update:modelValue', value))
watch(() => props.modelValue, value => { isActive.value = value })
</script>
