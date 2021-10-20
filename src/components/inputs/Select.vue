<template>
  <div>
    <label v-if="label" :for="name">{{ label }}</label>
    <select :id="name" :required="required" v-model="value">
      <option disabled v-if="required" :value="undefined">{{ t('select') }}</option>
      <option v-else :value="undefined">---</option>
      <option v-for="[name, value] in Object.entries(options)" :key="value" :value="value">{{ name }}</option>
    </select>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    required: Boolean,
    modelValue: String,
    options: {
      type: Object,
      required: true
    },
    label: String,
    name: String
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const value = ref(props.modelValue)
    watch(value, value => {
      emit('update:modelValue', value)
    })
    return {
      t,
      value
    }
  }
})
</script>

<style lang="sass" scoped>
label
  display: block
</style>
