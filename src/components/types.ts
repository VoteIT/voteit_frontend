import { ComponentPublicInstance } from 'vue'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void,
  focus: () => void,
  clear: () => void
}>
