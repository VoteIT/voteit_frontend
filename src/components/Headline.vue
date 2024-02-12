<template>
  <component :is="tag" class="editable-headline" @click="onClick">
    <input
      ref="inputEl"
      v-if="editActive"
      v-model="content"
      :maxlength="maxlength"
      @keydown.ctrl.enter="done"
      @keydown.enter.exact="done"
    />
    <template v-else>{{ content }}</template>
  </component>
</template>

<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

interface Props {
  modelValue: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  editing?: boolean
  clickToEdit?: boolean
  maxlength?: number
}
const props = withDefaults(defineProps<Props>(), {
  tag: 'h1'
})
const emit = defineEmits(['update:modelValue', 'update:editing', 'edit-done'])

const content = ref(props.modelValue)
const editActive = ref(props.editing)
const inputEl = ref<HTMLInputElement | null>(null)
watch(content, (value) => {
  // Always update modelValue if editing is requested from outside component
  if (props.editing) emit('update:modelValue', value)
})
watch(
  () => props.modelValue,
  (value) => {
    content.value = value
  }
)
watch(
  () => props.editing,
  (value) => {
    editActive.value = value
  }
)

async function onClick() {
  if (!props.clickToEdit) return
  editActive.value = true
  await nextTick()
  inputEl.value?.focus()
}

function done() {
  if (content.value !== props.modelValue)
    emit('update:modelValue', content.value)
  emit('edit-done')
  editActive.value = false
}

onClickOutside(inputEl, () => {
  if (!props.clickToEdit || !editActive.value) return
  content.value = props.modelValue
  editActive.value = false
})
</script>

<style lang="sass">
.editable-headline
  input
    width: 100%
    padding: 0 .3em
    background-color: rgb(var(--v-theme-surface))
    border: 1px solid rgb(var(--v-border-color))
    &:focus
      outline: none
</style>
