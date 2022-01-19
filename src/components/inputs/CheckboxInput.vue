<template>
  <v-checkbox v-model="value" :required="required" :label="label" />
  <!-- <input :id="name" type="checkbox" v-model="value" :required="required" />
  <label v-if="label" :for="name" class="inline">{{ label }}</label> -->
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  props: {
    modelValue: Boolean as PropType<boolean>,
    settings: Object,
    label: String,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const value = ref(!!props.modelValue)
    watch(value, value => {
      emit('update:modelValue', value)
    })
    return {
      value
    }
  }
}) as InputComponent
</script>
