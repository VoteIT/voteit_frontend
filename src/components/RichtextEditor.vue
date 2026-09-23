<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'

import type {
  EditorComponent,
  RichtextEditorEmits,
  RichtextEditorProps
} from './types'

// Quill and its styles are too large to ship with the app for views that never edit anything,
// so they load with the first view that shows an editor.
const QuillEditor = defineAsyncComponent(() => import('./QuillEditor.vue'))

const props = defineProps<RichtextEditorProps>()
const emit = defineEmits<RichtextEditorEmits>()

const editor = ref<EditorComponent | null>(null)

defineExpose({
  focus: () => editor.value?.focus(),
  setText: (value?: string) => editor.value?.setText(value ?? '')
})
</script>

<template>
  <QuillEditor
    ref="editor"
    v-bind="props"
    @blur="emit('blur')"
    @focus="emit('focus')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #controls>
      <slot name="controls"></slot>
    </template>
  </QuillEditor>
</template>
