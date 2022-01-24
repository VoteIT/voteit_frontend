<template>
  <v-form ref="form" :disabled="disabled" @submit="submit()">
    <component v-for="({ componentName, name, props }, i) in fields" :key="i" :is="componentName" v-bind="props" v-model="formData[name]" />
    <slot name="buttons" :disabled="disabled" :valid="valid" />
  </v-form>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, watch } from 'vue'
import { FieldRule, FieldType, FormSchema } from './types'

const componentNames: Record<FieldType, string> = {
  checkbox: 'v-checkbox',
  number: 'v-text-field', // ?
  select: 'v-text-field', // TODO
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
    const formData = reactive({ ...Object.fromEntries(props.schema.map(f => [f.name, f.default])), ...props.modelValue })
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

    const disabled = ref(false)
    const valid = computed(() => {
      return props.schema.every(field => {
        if (!field.rules) return true
        return (field.rules as FieldRule<unknown>[]).every(
          rule => !rule.validate || rule.validate(formData[field.name]) === true // true or a string
        )
      })
    })
    async function submit () {
      if (!props.handler) return emit('submit', formData.value)
      disabled.value = true
      try {
        await props.handler(formData)
        Object.assign(formData, props.modelValue)
        emit('saved')
      } catch (e) {
        console.log(e)
      } // TODOS
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
      // form,
      formData,
      valid,
      submit
    }
  }
})
</script>
