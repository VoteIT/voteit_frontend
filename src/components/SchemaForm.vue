<template>
  <v-form ref="form" :disabled="disabled" @submit="submit()">
    <component
      v-for="({ componentName, name, props }, i) in fields" :key="i"
      :is="componentName" v-bind="props" v-model="formData[name]"
      @blur="blurField(name)"
      :error="!!fieldErrors[name]" :messages="fieldErrors[name]"
    />
    <slot name="buttons" :disabled="disabled" :valid="valid" />
  </v-form>
</template>

<script lang="ts">
import { Component, defineComponent, PropType, reactive, ref, watch } from 'vue'
import axios, { AxiosError } from 'axios'

import CheckboxMultipleSelectVue from './inputs/CheckboxMultipleSelect.vue'
import { FieldType, FormField, FormSchema } from './types'

const componentNames: Record<FieldType, string | Component> = {
  checkbox: 'v-checkbox',
  checkbox_multiple: CheckboxMultipleSelectVue,
  number: 'v-text-field', // ?
  select: 'v-text-field', // TODO
  switch: 'v-switch',
  text: 'v-text-field',
  textarea: 'v-textarea'
}

function getFieldErrors (e: Error | AxiosError) {
  // TODO
  if (axios.isAxiosError(e)) {
    if (!e.response) return { __root__: 'Unkown error' }
    const { data } = e.response
    return data
  }
  return { __root__: 'Unkown error' }
}

export default defineComponent({
  emits: ['update:modelValue', 'saved', 'submit'],
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    schema: {
      type: Array as PropType<FormSchema>,
      required: true
    },
    handler: Function as PropType<(data: object) => Promise<any>>
  },
  setup (props, { emit }) {
    const formData = reactive(
      Object.fromEntries(
        props.schema.map(f => [f.name, props.modelValue[f.name] ?? f.default])
      )
    )
    const fieldErrors = ref<Record<string, string[] | undefined>>({})
    const fields = props.schema.map((field) => {
      const props = {
        label: field.label
        // Not supported in current vuetify alpha
        // rules: field.rules?.map((r) => r.validate).filter(Boolean) ?? []
      }
      if (field.rules) {
        for (const rule of field.rules) {
          Object.assign(props, rule.props)
        }
      }
      return {
        componentName: componentNames[field.type],
        ...field,
        props
      }
    })

    function cleanField (field: FormField) {
      let value = formData[field.name]
      for (const { clean } of field.rules || []) {
        // Mutter .... ### TypeScript says never...
        if (clean) value = (clean as (v: string) => string)(value)
      }
      // Avoid triggering unneccessary reactivity
      if (formData[field.name] !== value) formData[field.name] = value
    }
    function cleanForm () {
      for (const field of props.schema) {
        cleanField(field)
      }
    }
    function validateField (field: FormField) {
      const value = formData[field.name]
      for (const { validate } of field.rules || []) {
        // Mutter .... ### TypeScript says never...
        const result = (validate as (v: string) => string | true)?.(value)
        if (typeof result === 'string') return [result]
      }
    }
    function validateForm () {
      return props.schema.every(field => !validateField(field))
    }
    function blurField (name: string) {
      const field = fields.find(f => f.name === name)
      if (!field) throw new Error(`Unknown field "${name}"`)
      cleanField(field)
      const errors = validateField(field)
      if (errors) fieldErrors.value[name] = errors
    }

    const disabled = ref(false)
    const valid = ref(validateForm())
    async function submit () {
      cleanForm()
      valid.value = validateForm()
      if (!valid.value) return
      if (!props.handler) return emit('submit', formData.value)
      disabled.value = true
      try {
        await props.handler(formData)
        Object.assign(formData, props.modelValue)
        emit('saved')
      } catch (e) {
        fieldErrors.value = getFieldErrors(e as AxiosError)
      }
      disabled.value = false
    }

    // .validate() not supported in current vuetify alpha
    // const form = ref<ComponentPublicInstance<{ validate:() => void }> | null>(null)

    watch(formData, (value) => {
      // Not supported in current vuetify alpha
      // form.value?.validate()
      emit('update:modelValue', value)
    })

    return {
      disabled,
      fields,
      fieldErrors,
      // form,
      formData,
      valid,
      blurField,
      submit
    }
  }
})
</script>
