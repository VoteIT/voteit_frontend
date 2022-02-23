import { slugify, tagify } from '.'

export const disabled = {
  props: {
    disabled: true
  }
}

export const slug = {
  clean: (value: string) => slugify(value),
  validate: (value: string) => value === slugify(value) || 'Must only contain a-z, 0-9, separated by a single "-"'
}

export const tag = {
  clean: (value: string) => tagify(value),
  validate: (value: string) => value === tagify(value) || 'Must only contain word characters and numbers, separated by a single "-"'
}

export const required = {
  props: { required: true },
  validate: (value: string | number | boolean) => !!value || 'Required field'
}

export function minLength (length: number) {
  return {
    validate: (value: string) => value.length >= length || `Must be at least ${length} characters`
  }
}

export function selectOptions (options: Record<string, string>) {
  return {
    props: { options }
  }
}

// export const containsEmail: FieldRule<string> = {
//   props: { required: true },
//   validate: v => (v && v.length > 5 && v.includes('@')) || 'must contain at least one e-mail address'
// }
