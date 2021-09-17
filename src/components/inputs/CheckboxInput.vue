<template>
  <input :id="name" type="checkbox" v-model="value"/>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    },
    modelValue: Boolean as PropType<boolean>,
    settings: Object
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
