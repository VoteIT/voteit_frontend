import { ComponentPublicInstance } from '@vue/runtime-core'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void,
  focus: () => void,
  clear: () => void
}>
