<template>
  <component :is="tag" class="editable-headline" @click="onClick">
    <input ref="inputEl" v-if="editActive" v-model="content" @keydown.ctrl.enter="done()" @keydown.enter.exact="done()" />
    <template v-else>{{ content }}</template>
  </component>
</template>

<script lang="ts">
import { onClickOutside } from '@vueuse/core'
import { defineComponent, nextTick, ref, watch } from 'vue'

export default defineComponent({
  emits: ['update:modelValue', 'update:editing', 'edit-done'],
  props: {
    modelValue: {
      type: String,
      required: true
    },
    tag: {
      type: String,
      default: 'h1',
      validator: (value: string) => /^[hH][1-6]$/.test(value)
    },
    editing: Boolean,
    clickToEdit: Boolean
  },
  setup (props, { emit }) {
    const content = ref(props.modelValue)
    const editActive = ref(props.editing)
    const inputEl = ref<HTMLInputElement | null>(null)
    watch(content, value => {
      // Always update modelValue if editing is requested from outside component
      if (props.editing) emit('update:modelValue', value)
    })
    watch(() => props.modelValue, value => {
      content.value = value
    })
    watch(() => props.editing, value => {
      editActive.value = value
    })

    async function onClick () {
      if (!props.clickToEdit) return
      editActive.value = true
      await nextTick()
      inputEl.value?.focus()
    }

    function done () {
      if (content.value !== props.modelValue) emit('update:modelValue', content.value)
      emit('edit-done')
      editActive.value = false
    }

    onClickOutside(inputEl, () => {
      if (!props.clickToEdit || !editActive.value) return
      content.value = props.modelValue
      editActive.value = false
    })

    return {
      content,
      editActive,
      inputEl,
      onClick,
      done
    }
  }
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
