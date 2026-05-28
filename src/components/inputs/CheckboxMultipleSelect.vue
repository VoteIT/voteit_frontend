<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ValidationRule } from 'vuetify'

type ChoiceRecord = Record<string, boolean>

function createInitialValues(
  keys: string[],
  values: Set<string>
): ChoiceRecord {
  return Object.fromEntries(keys.map((k) => [k, values.has(k)]))
}

function toOutputValue(obj: ChoiceRecord): string[] {
  return Object.keys(obj).filter((k) => obj[k])
}

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    settings: { options: Record<string, string> }
    label?: string
    requiredValues?: string[]
    rules?: ValidationRule[]
    errorMessages?: string | string[]
  }>(),
  {
    modelValue: () => [],
    requiredValues: () => [],
    rules: () => [],
    errorMessages: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

if (!props.settings?.options)
  throw new Error(
    'CheckboxMultipleSelect requires :settings="{ options: Record<string, string> }"'
  )

const val = reactive(
  createInitialValues(
    Object.keys(props.settings.options),
    new Set([...props.modelValue, ...props.requiredValues])
  )
)

watch(
  () => props.modelValue,
  (values) => {
    if (!props.settings?.options) return
    for (const key in props.settings.options) {
      val[key] = values.includes(key)
    }
  }
)

watch(val, (value) => {
  emit('update:modelValue', toOutputValue(value))
})
</script>

<template>
  <v-input
    :model-value="modelValue"
    :label="label"
    :rules="rules"
    :error-messages="errorMessages"
  >
    <div class="mb-4 d-flex flex-wrap">
      <v-checkbox
        v-for="[key, optionLabel] in Object.entries(settings.options)"
        :key="key"
        v-model="val[key]"
        :label="optionLabel"
        :disabled="requiredValues.includes(key)"
        density="compact"
        hide-details
        class="flex-grow-0"
      />
    </div>
  </v-input>
</template>

<style lang="sass" scoped>
span
  white-space: nowrap
  margin-right: 1em
label
  font-size: 12pt
  font-weight: normal
  display: inline
</style>
