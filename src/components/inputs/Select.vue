<template>
  <label v-if="label" :for="name">{{ label }}</label>
  <select :id="name" :required="required" v-model="val">
    <option disabled v-if="required" :value="undefined">{{ t('select') }}</option>
    <option v-else :value="undefined">---</option>
    <option v-for="[name, value] in Object.entries(options)" :key="value" :value="value">{{ name }}</option>
  </select>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  inject: ['t'],
  props: {
    required: Boolean,
    modelValue: String,
    options: {
      type: Object,
      required: true
    },
    label: String
  },
  setup (props, { emit }) {
    const val = ref(props.modelValue)
    watch(val, value => {
      emit('update:modelValue', value)
    })
    watch(() => props.modelValue, value => {
      val.value = value
    })
    return {
      val
    }
  }
})
</script>
