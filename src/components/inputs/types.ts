import { DefineComponent } from '@vue/runtime-core'

export enum InputType {
  Checkbox = 'checkbox',
  Checkboxes = 'checkboxes',
  Email = 'email',
  Number = 'number',
  Text = 'text'
}

export interface SchemaInput {
  name: string
  type: InputType
  label?: string
  value?: any
  settings?: object
}

export interface SchemaButton {
  name: string
  label: string
  icon?: string
}

export type InputComponent = DefineComponent<{
  name: string
  settings: object
}, any>

export interface InputDefaultsComponent {
  component: InputComponent
  defaults?: object
}

export type SchemaGenerator = (
  t: (key: string) => string,
  proposals: number
) => SchemaInput[]
