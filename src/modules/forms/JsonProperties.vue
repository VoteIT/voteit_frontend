<script setup lang="ts" generic="T extends {}">
import { computed, reactive, watch } from 'vue'

import useRules from '@/composables/useRules'

import { Field, JsonObject, JsonSchema } from './types'
import fields from './fields'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  errors?: Partial<Record<string, string[]>>
  modelValue: T
  properties: JsonSchema<T>['properties']
  required?: (keyof T)[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const { t } = useI18n()
const rules = useRules(t)

const formData = reactive(props.modelValue || {})
watch(formData, (value) => emit('update:modelValue', value as T))

function withRequired(
  name: keyof T,
  _rules: ((value: string) => true | string)[]
) {
  return props.required?.includes(name) ? [rules.required, ..._rules] : _rules
}

function fieldToInput(name: keyof T, field: Field) {
  const required = !!props.required?.includes(name)
  const { getComponent, getProps, getRules } = fields[field.type]
  const component = getComponent(field)
  const clearable = component === 'v-text-field' ? !required : undefined
  return {
    name,
    component,
    props: {
      ...getProps?.(field),
      clearable,
      error: !!props.errors?.[name as string],
      errorMessages: props.errors?.[name as string],
      label: field.label,
      hint: field.hint,
      required,
      rules: withRequired(name, getRules?.(field, t) ?? [])
    }
  }
}

const computedFields = computed(() => {
  return Object.entries(props.properties).map((entry) => {
    const [name, field] = entry as [keyof T, Field | JsonObject<any>]
    if (field.type === 'object')
      return {
        name,
        properties: field.properties
      } as const
    return fieldToInput(name, field)
  })
})
</script>

<template>
  <div>
    <template v-for="f in computedFields" :key="f.name">
      <JsonProperties
        v-if="!('component' in f)"
        :errors="errors"
        :required="required"
        :properties="f.properties as any"
        v-model="(formData as any)[f.name]"
      />
      <component
        v-else
        :is="f.component"
        :name="f.name"
        v-bind="f.props"
        v-model="(formData as T)[f.name]"
      />
    </template>
  </div>
</template>
