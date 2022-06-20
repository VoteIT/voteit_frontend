<template>
  <v-form
    ref="form"
    v-model="valid"
    @submit.prevent="submit()"
  >
    <component
      v-for="(field, i) in fields" :key="i"
      :is="field.component" v-bind="field.props" v-model="formData[field.name]"
      @blur="cleanField(field)"
      :error="!!fieldErrors[field.name]" :messages="fieldErrors[field.name] || field.messages"
    />
    <slot name="buttons" :valid="valid" :submitting="submitting" :disabled="submitting || !valid" />
  </v-form>
</template>

<script lang="ts">
import { Component, ComponentPublicInstance, defineComponent, PropType, reactive, ref, watch } from 'vue'

import { parseRestError } from '@/utils/restApi'

import CheckboxMultipleSelectVue from './inputs/CheckboxMultipleSelect.vue'
import type { FieldType, FormField, FormSchema } from './types'

const componentNames: Record<FieldType, string | Component> = {
  checkbox: 'v-checkbox',
  checkbox_multiple: CheckboxMultipleSelectVue,
  number: 'v-text-field', // ?
  select: 'v-select',
  switch: 'v-switch',
  text: 'v-text-field',
  textarea: 'v-textarea'
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
    const valid = ref(false)
    const formData = reactive(
      Object.fromEntries(
        props.schema.map(f => [f.name, props.modelValue[f.name] ?? f.default])
      )
    )
    const fieldErrors = ref<Record<string, string[] | undefined>>({})
    const fields = props.schema.map(({ name, rules, type, ...props }) => {
      const fieldValidators = rules?.map(r => r.validate).filter(v => v)
      for (const rule of rules || []) {
        Object.assign(props, rule.props)
      }
      return {
        component: componentNames[type],
        name,
        rules: fieldValidators,
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

    const submitting = ref(false)
    async function submit () {
      cleanForm()
      if (!valid.value) return
      if (!props.handler) return emit('submit', formData.value)
      submitting.value = true
      try {
        await props.handler(formData)
        Object.assign(formData, props.modelValue)
        emit('saved')
      } catch (e) {
        fieldErrors.value = parseRestError(e)
      }
      submitting.value = false
    }

    const form = ref<ComponentPublicInstance<{ validate:() => void }> | null>(null)

    watch(formData, (value) => {
      // Not supported in current vuetify alpha
      fieldErrors.value = {}
      form.value?.validate()
      emit('update:modelValue', value)
    })

    return {
      fields,
      fieldErrors,
      form,
      formData,
      submitting,
      valid,
      cleanField,
      submit
    }
  }
})
</script>
