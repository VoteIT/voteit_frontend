import { FieldRule, FieldType, FormField } from '@/components/types'
import useRules from '@/composables/useRules'
import type { ComposerTranslation } from 'vue-i18n'

// interface IntegerField {
//   type: 'integer'
// }

interface BooleanField {
  type: 'boolean'
  label: string
  hint?: string
}

interface NumberField {
  type: 'number'
  label: string
  hint?: string
  exclusiveMaximum?: number
  exclusiveMinimum?: number
  maximum?: number
  minimum?: number
  multipleOf?: number
}

interface StringField {
  type: 'string'
  label: string
  hint?: string
  maxLength?: number
  minLength?: number
  pattern?: string
}

type Field = BooleanField | NumberField | StringField

interface JsonSchema<Props extends string> {
  properties: {[P in Props]: Field},
  required?: Partial<Props>[]
}

/**
 * Create a FormSchema with rules and props for use in SchemaForm component
 */
export default function createFormSchema<Props extends string> (t: ComposerTranslation, schema: JsonSchema<Props>): FormField[] {
  const rules = useRules(t)

  function withRequired<V> (name: Props, generator?: Generator<FieldRule<V>>) {
    const _rules: FieldRule<V>[] = generator
      ? [...generator]
      : []
    if (schema.required?.includes(name)) _rules.push({ props: { required: true }, validate: rules.required })
    return _rules
  }

  return (Object.entries(schema.properties) as [Props, Field][])
    // eslint-disable-next-line array-callback-return
    .map(([name, field]) => {
      switch (field.type) {
        case 'boolean': {
          return {
            name,
            type: FieldType.Checkbox,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name)
          }
        }
        case 'number': {
          const max = field.exclusiveMaximum
            ? field.exclusiveMaximum - 1
            : field.maximum
          const min = field.exclusiveMinimum
            ? field.exclusiveMinimum + 1
            : field.minimum
          function * getRules (): Generator<FieldRule> {
            if (typeof max === 'number') yield { props: { max }, validate: rules.max(max) }
            if (typeof min === 'number') yield { props: { min }, validate: rules.min(min) }
          }
          return {
            name,
            type: FieldType.Number,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name, getRules())
          }
        }
        case 'string': {
          function * getRules ({ maxLength, minLength }: StringField): Generator<FieldRule> {
            if (maxLength) yield { props: { maxlength: maxLength }, validate: rules.maxLength(maxLength) }
            if (minLength) yield { props: { minlength: minLength }, validate: rules.minLength(minLength) }
          }
          return {
            name,
            type: FieldType.Text,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name, getRules(field))
          }
        }
      }
    })
}
