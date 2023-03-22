<template>
  <label v-if="label">{{ label }}</label>
  <div class="mb-4 d-flex flex-wrap">
    <v-checkbox v-for="[key, label] in Object.entries(settings.options)" :key="key" v-model="val[key]" :label="label" :disabled="requiredValues.includes(key)" density="compact" hide-details class="flex-grow-0" />
  </div>
</template>

<script lang="ts">
import { Dictionary } from 'lodash'
import { defineComponent, PropType, reactive, watch } from 'vue'

type ChoiceRecord = Record<string, boolean>

function createInitialValues (keys: string[], values: Set<string>): ChoiceRecord {
  return Object.fromEntries(
    keys.map(k => [k, values.has(k)])
  )
}

function toOutputValue (obj: ChoiceRecord): string[] {
  return Object.keys(obj)
    .filter(k => obj[k])
}

export default defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    settings: {
      type: Object as PropType<{ options: Dictionary<string> }>,
      required: true
    },
    label: String,
    requiredValues: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  setup (props, { emit }) {
    if (!props.settings?.options) throw new Error('CheckboxMultipleSelect requires :settings="{ options: Record<string, string> }"')
    const val = reactive(createInitialValues(
      Object.keys(props.settings.options),
      new Set([...props.modelValue, ...props.requiredValues])
    ))
    watch(() => props.modelValue, values => {
      if (!props.settings?.options) return
      for (const key in props.settings.options) {
        val[key] = values.includes(key)
      }
    })
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
  display: inline
</style>
