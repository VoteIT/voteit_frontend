import { Proposal } from '@/modules/proposals/types'
import { DefineComponent, PropType } from '@vue/runtime-core'
import { FormSchema } from '../types'

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
) => FormSchema
