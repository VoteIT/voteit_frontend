// interface IntegerField {
//   type: 'integer'
// }

export interface BooleanField {
  type: 'boolean'
  label: string
  hint?: string
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
  // oneOf?: OneOf<number>[]
}

export interface StringField {
  type: 'string'
  label: string
  hint?: string
  maxLength?: number
  minLength?: number
  oneOf?: OneOf[]
  pattern?: string
}

export type Field = ArrayField | BooleanField | NumberField | StringField
export type JsonProperties<T extends {}> = { [P in keyof T]: Field }
export interface JsonObject<T extends {}> {
  type: 'object'
  properties: JsonProperties<T>
}

export interface JsonSchema<T extends {}> {
  properties: { [P in keyof T]: Field | JsonObject<P> }
  required?: (keyof T)[]
}
