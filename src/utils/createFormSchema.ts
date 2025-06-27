/**
 * Deprecated.
 * Use modules/forms/JsonSchemaForm.vue going forward, or possibly switch to vuetify-jsonschema-form.
 * https://koumoul-dev.github.io/vuetify-jsonschema-form/latest/getting-started/
 */
import { FieldRule, FieldType, FormField } from '@/components/types'
import useRules from '@/composables/useRules'
import type { JsonSchema, Field, StringField } from '@/modules/forms/types'
import type { ComposerTranslation } from 'vue-i18n'

/**
 * Create a FormSchema with rules and props for use in SchemaForm component
 */
export default function createFormSchema<T extends {}>(
  t: ComposerTranslation,
  schema: JsonSchema<T>
): FormField[] {
  const rules = useRules(t)

  function withRequired<V>(name: keyof T, generator?: Generator<FieldRule<V>>) {
    return schema.required?.includes(name)
      ? [
          ...(generator || []),
          { props: { required: true }, validate: rules.required }
        ]
      : [...(generator || []), { props: { clearable: true } }]
  }

  return (Object.entries(schema.properties) as [keyof T, Field][]).map(
    ([name, field]) => {
      switch (field.type) {
        case 'array':
          return {
            name: name as string,
            type: FieldType.Select,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name),
            items: field.items.oneOf.map((i) => ({
              value: i.const,
              title: i.title
            }))
          }
        case 'boolean': {
          return {
            name: name as string,
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
          function* getRules(): Generator<FieldRule> {
            if (typeof max === 'number')
              yield { props: { max }, validate: rules.max(max) }
            if (typeof min === 'number')
              yield { props: { min }, validate: rules.min(min) }
          }
          return {
            name: name as string,
            type: FieldType.Number,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name, getRules())
          }
        }
        case 'string': {
          function* getRules({
            maxLength,
            minLength
          }: StringField): Generator<FieldRule> {
            if (maxLength)
              yield {
                props: { maxlength: maxLength },
                validate: rules.maxLength(maxLength)
              }
            if (minLength)
              yield {
                props: { minlength: minLength },
                validate: rules.minLength(minLength)
              }
          }
          return {
            name: name as string,
            type: FieldType.Text,
            label: field.label,
            hint: field.hint,
            rules: withRequired(name, getRules(field))
          }
        }
      }
    }
  )
}
