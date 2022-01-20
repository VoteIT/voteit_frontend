<template>
  <v-field active model-value="value" :label="label">
    <select :id="name" :required="required" v-model="value" class="v-field__input">
      <option v-if="!required" :value="undefined">---</option>
      <option v-for="[value, name] in Object.entries(options)" :key="value" :value="value">{{ name }}</option>
    </select>
  </v-field>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    label: String,
    modelValue: String,
    name: String,
    settings: Object,
    options: {
      type: Object as PropType<Record<string, string>>,
      required: true
    },
    required: Boolean,
    toNumber: Boolean
  },
  setup (props, { emit }) {
    const value = ref(props.modelValue)
    watch(value, value => {
      if (props.toNumber && value !== undefined) return emit('update:modelValue', Number(value))
      emit('update:modelValue', value)
    })
    return {
      value
    }
  }
}) as InputComponent
</script>
