import { ComposerTranslation } from 'vue-i18n'

import useRules from '@/composables/useRules'
import CheckboxMultipleSelect from './CheckboxMultipleSelect.vue'
import { ArrayField, Field, NumberField, StringField } from './types'
import { Component } from 'vue'

interface IField {
  getComponent(field: Field): string | Component
  getProps?(field: Field): object
  getRules?(
    field: Field,
    t: ComposerTranslation
  ): ((value: string) => string | true)[]
}

function getMax(field: NumberField) {
  if (typeof field.maximum === 'number') return field.maximum
  if (typeof field.exclusiveMaximum !== 'number') return
  const step = field.multipleOf ?? 1
  return field.exclusiveMaximum - step
}
function getMin(field: NumberField) {
  if (typeof field.minimum === 'number') return field.minimum
  if (typeof field.exclusiveMinimum !== 'number') return
  const step = field.multipleOf ?? 1
  return field.exclusiveMinimum + step
}

const fields: Record<Field['type'], IField> = {
  array: {
    getComponent(field: ArrayField) {
      if (field['x-display'] === 'checkboxes') return CheckboxMultipleSelect
      return 'v-select'
    },
    getProps(field: ArrayField) {
      if (field['x-display'] === 'checkboxes')
        return {
          items: field.items.oneOf
        }
      return {
        items: field.items.oneOf,
        itemValue: 'const',
        multiple: true
      }
    }
  },
  boolean: {
    getComponent() {
      return 'v-checkbox'
    }
  },
  number: {
    getComponent(field: NumberField) {
      return field.oneOf ? 'v-select' : 'v-text-field'
    },
    getProps(field: NumberField) {
      if (field.oneOf) return { items: field.oneOf, itemValue: 'const' }
      return {
        type: 'number',
        max: getMax(field),
        min: getMin(field),
        step: field.multipleOf
      }
    },
    getRules(field: NumberField, t) {
      const rules = useRules(t)
      function* iterRules() {
        const max = getMax(field)
        if (max) yield rules.max(max)
        const min = getMin(field)
        if (min) yield rules.min(min)
      }
      return [...iterRules()]
    }
  },
  string: {
    getComponent(field: StringField) {
      return field.oneOf ? 'v-select' : 'v-text-field'
    },
    getProps(field: StringField) {
      if (field.oneOf) return { items: field.oneOf, itemValue: 'const' }
      return {
        minlength: field.minLength,
        maxlength: field.maxLength
      }
    },
    getRules(field: StringField, t) {
      const rules = useRules(t)
      function* iterRules() {
        if (field.maxLength) yield rules.maxLength(field.maxLength)
        if (field.minLength) yield rules.minLength(field.minLength)
      }
      return [...iterRules()]
    }
  }
}

export default fields
