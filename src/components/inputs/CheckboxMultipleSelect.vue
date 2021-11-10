<template>
  <label v-if="label">{{ label }}</label>
  <div class="mb-4">
    <span v-for="[title, value] in Object.entries(settings.options)" :key="value">
      <input :id="`${name}-choice-${value}`" type="checkbox" v-model="val[value]">
      <label :for="`${name}-choice-${value}`">{{ title }}</label>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'
import { InputComponent } from './types'

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
  emits: ['update:modelValue'],
  props: {
    name: {
      type: String,
      required: true
    },
    modelValue: Array as PropType<string[]>,
    settings: {
      type: Object,
      required: true
    },
    label: String
  },
  setup (props, { emit }) {
    const val = reactive(createInitialOptions(props.settings.options, props.modelValue || []))
    watch(val, value => {
      emit('update:modelValue', toOutputValue(value))
    })
    return {
      val
    }
  }
}) as InputComponent
</script>

<style lang="sass" scoped>
span
  white-space: nowrap
  margin-right: 1em
label
  font-size: 12pt
  font-weight: normal
  display: inline
</style>
