<template>
  <v-form
    ref="form"
    v-model="valid"
    @submit.prevent="submit"
  >
    <component
      v-for="(field, i) in fields" :key="i"
      :is="field.component" v-bind="field.props" v-model="formData[field.name]"
      @blur="cleanField(field)"
      :error="!!fieldErrors[field.name]" :messages="fieldErrors[field.name]"
    />
    <slot name="buttons" :valid="valid" :submitting="submitting" :disabled="submitting || valid === false" />
  </v-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { ComponentPublicInstance, Component } from 'vue'

import useErrorHandler from '@/composables/useErrorHandler'
import CheckboxMultipleSelect from './inputs/CheckboxMultipleSelect.vue'
import DurationInput from './inputs/DurationInput.vue'
import { FieldType } from './types'
import type { FieldRule, FormSchema } from './types'
import { isValidationError } from '@/utils/Socket'

const componentNames: Record<FieldType, string | Component> = {
  checkbox: 'v-checkbox',
  checkbox_multiple: CheckboxMultipleSelect,
  duration: DurationInput,
  number: 'v-text-field',
  select: 'v-select',
  switch: 'v-switch',
  text: 'v-text-field',
  textarea: 'v-textarea'
}

interface Props {
  modelValue?: any
  schema: FormSchema
  handler? (data: any): Promise<void>
  validateImmediately?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})
const emit = defineEmits(['update:modelValue', 'update:valid', 'saved', 'submit'])

const { fieldErrors, clearErrors, handleRestError, handleSocketError } = useErrorHandler()

const valid = ref<boolean | null>(null)
const formData = reactive(
  Object.fromEntries(
    props.schema.map(f => [f.name, props.modelValue[f.name] ?? f.default])
  )
)

const fields = props.schema.map(({ name, rules, type, ...props }) => {
  const fieldValidators = rules?.map(r => r.validate).filter(v => v)
  // Special case for numbers
  if (type === FieldType.Number) Object.assign(props, { type: 'number' })
  for (const rule of rules || []) {
    Object.assign(props, rule.props)
  }
  return {
    component: componentNames[type],
    name,
    props: {
      rules: fieldValidators,
      ...props
    },
    rules
  }
})

function cleanField ({ name, rules }: { name: string, rules?: FieldRule<any>[] }) {
  let value = formData[name]
  for (const { clean } of rules || []) {
    if (clean) value = clean(value)
  }
  // Avoid triggering unneccessary reactivity
  if (formData[name] !== value) formData[name] = value
}
function cleanForm () {
  for (const field of props.schema) {
    cleanField(field)
  }
}

const submitting = ref(false)
async function submit () {
  cleanForm()
  form.value?.validate()
  if (!valid.value) return
  if (!props.handler) return emit('submit', formData.value)
  submitting.value = true
  try {
    await props.handler(formData)
    Object.assign(formData, props.modelValue) // Updates values from props
    emit('saved')
  } catch (e) {
    if (isValidationError(e)) handleSocketError(e)
    else handleRestError(e)
  }
  submitting.value = false
}

const form = ref<ComponentPublicInstance<{ validate:() => void }> | null>(null)

watch(formData, (value) => {
  clearErrors()
  emit('update:modelValue', value)
})

if (props.validateImmediately) {
  watch(form, form => {
    form?.validate()
  })
}

watch(valid, value => {
  emit('update:valid', value)
})
</script>
