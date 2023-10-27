<script setup lang="ts" generic="T extends {}">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'

import type { Field, JsonSchema } from './types'
import fields from './fields'

const props = defineProps<{
  errors?: Partial<Record<keyof T | '__root__', string[]>>
  modelValue: T
  schema: JsonSchema<T>
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

const { t } = useI18n()
const { required } = useRules(t)

const formData = reactive(props.modelValue)
watch(formData, () => emit('changed'))

function withRequired(
  name: keyof T,
  rules: ((value: string) => true | string)[]
) {
  return props.schema.required?.includes(name) ? [required, ...rules] : rules
}

function fieldToInput(name: keyof T, field: Field) {
  const required = !!props.schema.required?.includes(name)
  const f = fields[field.type]
  const clearable = f.component === 'v-text-field' ? !required : undefined
  return {
    name,
    component: f.component,
    props: {
      ...f.getProps?.(field),
      clearable,
      error: !!props.errors?.[name],
      errorMessages: props.errors?.[name],
      label: field.label,
      hint: field.hint,
      required,
      rules: withRequired(name, f.getRules?.(field, t) ?? [])
    }
  }
}

const computedSchema = computed(() => {
  return Object.entries(props.schema.properties).map(([name, field]) =>
    fieldToInput(name as keyof T, field as Field)
  )
})

const nonFieldErrors = computed(() => {
  return props.errors?.__root__
})
</script>

<template>
  <div>
    <div v-if="nonFieldErrors" class="text-warning mb-2">
      <p v-for="err in nonFieldErrors" :key="err">
        {{ err }}
      </p>
    </div>
    <component
      v-for="f in computedSchema"
      :key="f.name"
      :is="f.component"
      :name="f.name"
      v-bind="f.props"
      v-model="(formData as T)[f.name]"
    />
  </div>
</template>
