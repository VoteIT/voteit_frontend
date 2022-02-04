import { slugify } from '.'

export const disabled = {
  props: {
    disabled: true
  }
}

export const slug = {
  clean: (value: string) => slugify(value),
  validate: (value: string) => value === slugify(value) || 'Must only contain a-z, 0-9, separated by a single "-"'
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
