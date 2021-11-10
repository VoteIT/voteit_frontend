import { Proposal } from '@/modules/proposals/types'
import { DefineComponent, PropType } from '@vue/runtime-core'

export enum InputType {
  Checkbox = 'checkbox',
  Checkboxes = 'checkboxes',
  Email = 'email',
  Number = 'number',
  Select = 'select',
  Text = 'text'
}

export interface SchemaInput {
  name: string
  type: InputType
  label?: string
  settings?: object
}

export interface SchemaButton {
  name: string
  label: string
  icon?: string
}

export type InputComponent = DefineComponent<{
  modelValue: any,
  name: PropType<string>,
  required: PropType<boolean>,
  settings: PropType<object>,
  label: PropType<string>
}>

export interface InputDefaultsComponent {
  component: InputComponent
  defaults?: object
}

export type SchemaGenerator = (
  t: (key: string) => string,
  proposals: Proposal[]
) => SchemaInput[]
