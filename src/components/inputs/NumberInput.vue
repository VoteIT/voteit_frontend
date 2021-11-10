<template>
  <v-text-field :label="label" type="number" v-model="value" :min="settings.min" :max="settings.max" :required="required" />
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
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
  setup (props, { emit }) {
    const value = ref(String(props.modelValue))
    watch(value, value => {
      emit('update:modelValue', Number(value))
    })
    return {
      value
    }
  }
}) as InputComponent
</script>
