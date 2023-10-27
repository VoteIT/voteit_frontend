import { ComposerTranslation } from 'vue-i18n'
import { Field, NumberField, StringField } from './types'
import useRules from '@/composables/useRules'

interface IField {
  component: string
  getProps?(field: Field): object
  getRules?(
    field: Field,
    t: ComposerTranslation
  ): ((value: string) => string | true)[]
}

function getMax(field: NumberField) {
  if (field.maximum) return field.maximum
  if (!field.exclusiveMaximum) return
  const step = field.multipleOf ?? 1
  return field.exclusiveMaximum - step
}
function getMin(field: NumberField) {
  if (field.minimum) return field.minimum
  if (!field.exclusiveMinimum) return
  const step = field.multipleOf ?? 1
  return field.exclusiveMinimum + step
}

const fields: Record<Field['type'], IField> = {
  boolean: {
    component: 'v-checkbox'
  },
  number: {
    component: 'v-text-field',
    getProps(field: NumberField) {
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
    component: 'v-text-field',
    getProps(field: StringField) {
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
