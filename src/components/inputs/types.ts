import { Component, PropType } from 'vue'

export type InputComponent = Component<{
  modelValue: any
  name: PropType<string>
  required: PropType<boolean>
  settings: PropType<object>
  label: PropType<string>
}>
