<template>
  <v-text-field :id="name" :label="label" :type="settings.type ?? 'text'" v-model="value" :required="required" />
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
    modelValue: String,
    settings: Object,
    label: String,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const value = ref(props.modelValue)
    watch(value, value => {
      emit('update:modelValue', value)
    })
    return {
      value
    }
  }
}) as InputComponent
</script>
