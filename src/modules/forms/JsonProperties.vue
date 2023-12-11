<script setup lang="ts" generic="T extends {}">
import { computed, reactive, watch } from 'vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'

import type { Field, JsonObject, JsonProperties } from './types'
import fields from './fields'

function isClearableComponent(component: string | Component) {
  if (typeof component !== 'string') return false
  return ['v-text-field', 'v-select'].includes(component)
}

const props = defineProps<{
  errors?: Partial<Record<string, string[]>>
  modelValue: T
  nameSpace?: string
  properties: JsonProperties<T>
  required?: (keyof T)[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const { t } = useI18n()
const rules = useRules(t)

const formData = reactive<any>(props.modelValue || {}) // TODO not any
watch(formData, (value) => emit('update:modelValue', value as T))
watch(
  () => props.modelValue,
  (value) => {
    Object.assign(formData, value)
  }
)

function withRequired(
  name: keyof T,
  _rules: ((value: string) => true | string)[]
) {
  return props.required?.includes(name) ? [rules.required, ..._rules] : _rules
}

function getName(key: keyof T) {
  return props.nameSpace
    ? `${props.nameSpace}.${key as string}`
    : (key as string)
}

function fieldToInput(key: keyof T, field: Field) {
  const required = !!props.required?.includes(key)
  const { getComponent, getProps, getRules } = fields[field.type]
  const component = getComponent(field)
  const clearable = isClearableComponent(component) ? !required : undefined
  return {
    key,
    name: getName(key),
    component,
    props: {
      ...getProps?.(field),
      clearable,
      disabled: field.readOnly,
      error: !!props.errors?.[key as string],
      errorMessages: props.errors?.[key as string],
      label: field.label,
      hint: field.hint,
      required,
      rules: withRequired(key, getRules?.(field, t) ?? [])
    }
  }
}

const computedFields = computed(() => {
  return Object.entries(props.properties).map((entry) => {
    const [key, field] = entry as [
      keyof T,
      T[keyof T] extends object ? JsonObject<JsonProperties<T[keyof T]>> : Field
    ]
    if (field.type === 'object')
      return {
        key,
        name: getName(key),
        properties: field.properties as any, // TODO
        required: field.required as any
      }
    return fieldToInput(key as keyof T, field)
  })
})
</script>

<template>
  <div>
    <template v-for="f in computedFields" :key="f.name">
      <JsonProperties
        v-if="!('component' in f)"
        :errors="errors"
        :name-space="f.name"
        :required="f.required"
        :properties="f.properties"
        v-model="formData[f.key]"
        :key="`group:${f.name}`"
      />
      <component
        v-else
        :is="f.component"
        :name="f.name"
        v-bind="f.props"
        v-model="formData[f.key]"
        :key="f.name"
      />
    </template>
  </div>
</template>
