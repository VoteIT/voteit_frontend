<template>
  <component :is="tag" class="editable-headline">
    <input v-if="editing" v-model="content" @keydown.ctrl.enter="$emit('edit-done')"/>
    <template v-else>{{ content }}</template>
  </component>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  emits: ['update:modelValue', 'edit-done'],
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
    editing: Boolean
  },
  setup (props, { emit }) {
    const content = ref(props.modelValue)
    watch(content, value => {
      emit('update:modelValue', value)
    })
    watch(() => props.modelValue, value => {
      content.value = value
    })
    return { content }
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
