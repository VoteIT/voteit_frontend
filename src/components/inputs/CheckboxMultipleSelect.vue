<template>
  <div>
    <span v-for="[title, value] in Object.entries(options)" :key="value">
      <input :id="`${name}-choice-${value}`" type="checkbox" v-model="val[value]">
      <label :for="`${name}-choice-${value}`">{{ title }}</label>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'

type ChoiceRecord = Record<string, boolean>

function createInitialOptions (options: Record<string, string>, values: string[]): ChoiceRecord {
  const obj: ChoiceRecord = {}
  for (const value of Object.values(options)) {
    obj[value] = values.includes(value)
  }
  return obj
}

function toOutputValue (obj: ChoiceRecord): string[] {
  return Object.entries(obj)
    .filter(e => e[1])
    .map(e => e[0])
}

export default defineComponent({
  inject: ['t'],
  props: {
    required: Boolean,
    name: {
      type: String,
      required: true
    },
    modelValue: Array as PropType<string[]>,
    options: {
      type: Object as PropType<Record<string, string>>,
      required: true
    }
  },
  setup (props, { emit }) {
    const val = reactive(createInitialOptions(props.options, props.modelValue || []))
    watch(val, value => {
      emit('update:modelValue', toOutputValue(value))
    })
    return {
      val
    }
  }
})
</script>

<style lang="sass" scoped>
span
  white-space: nowrap
  margin-right: 1em
label
  font-size: 12pt
  font-weight: normal
</style>
