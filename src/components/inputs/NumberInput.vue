<template>
  <v-text-field
    :label="label"
    type="number"
    v-model="model"
    :min="settings.min"
    :max="settings.max"
    :required="required"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  props: {
    modelValue: Number,
    settings: Object,
    label: {
      type: String,
      required: true
    },
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return {
      model: computed({
        get() {
          return String(props.modelValue)
        },
        set(value: string) {
          // strValue.value = value
          emit('update:modelValue', Number(value) || undefined)
        }
      })
    }
  }
}) as InputComponent
</script>
