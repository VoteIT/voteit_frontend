// interface IntegerField {
//   type: 'integer'
// }

export interface BooleanField {
  type: 'boolean'
  label: string
  hint?: string
  readOnly?: boolean
}

// TODO Maybe
interface OneOf<T = string> {
  const: T
  title: string
}

export interface ArrayField {
  type: 'array'
  label: string
  hint?: string
  items: {
    type: 'string'
    oneOf: OneOf[]
  }
  readOnly?: boolean
  'x-display'?: 'checkboxes'
}

export interface NumberField {
  type: 'number'
  label: string
  hint?: string
  exclusiveMaximum?: number
  exclusiveMinimum?: number
  readOnly?: boolean
  maximum?: number
  minimum?: number
  multipleOf?: number
  // oneOf?: OneOf<number>[]
}

export interface StringField {
  type: 'string'
  label: string
  hint?: string
  readOnly?: boolean
  maxLength?: number
  minLength?: number
  oneOf?: OneOf[]
  pattern?: string
}

export interface JsonObject<Properties extends {}> {
  type: 'object'
  properties: Properties
  required?: (keyof Properties)[]
}

export type Field = ArrayField | BooleanField | NumberField | StringField
export type JsonProperties<T extends {}> = {
  [P in keyof T]: T[P] extends object ? JsonObject<JsonProperties<T[P]>> : Field
}

export interface JsonSchema<T extends {}> {
  properties: JsonProperties<T>
  required?: (keyof T)[]
}
