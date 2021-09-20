<template>
  <label v-if="label" :for="name">{{ label }}</label>
  <input :id="name" type="number" v-model="value" :min="settings.min" :max="settings.max"/>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    },
    modelValue: Number,
    settings: Object,
    label: String
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const value = ref(props.modelValue)
    watch(value, value => {
      emit('update:modelValue', Number(value))
    })
    return {
      value
    }
  }
}) as InputComponent
</script>
