// interface IntegerField {
//   type: 'integer'
// }

export interface BooleanField {
  type: 'boolean'
  label: string
  hint?: string
}

export interface NumberField {
  type: 'number'
  label: string
  hint?: string
  exclusiveMaximum?: number
  exclusiveMinimum?: number
  maximum?: number
  minimum?: number
  multipleOf?: number
}

export interface StringField {
  type: 'string'
  label: string
  hint?: string
  maxLength?: number
  minLength?: number
  pattern?: string
}

export type Field = BooleanField | NumberField | StringField

export interface JsonSchema<T extends {}> {
  properties: { [P in keyof T]: Field }
  required?: (keyof T)[]
}
