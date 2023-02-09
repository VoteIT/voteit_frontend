import { Component, PropType } from 'vue'

import { FormSchema } from '../types'
import { ComposerTranslation } from 'vue-i18n'

export interface SchemaButton {
  name: string
  label: string
  icon?: string
}

export type InputComponent = Component<{
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
  t: ComposerTranslation,
  proposals: number
) => FormSchema
