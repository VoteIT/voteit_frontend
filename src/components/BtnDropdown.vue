<template>
  <span
    class="btn-dropdown"
    :class="{ dark, isOpen, right }"
    @keydown.esc.prevent="isOpen = false"
  >
    <slot name="activator" :toggle="toggle"></slot>
    <v-btn
      v-if="title && !$slots.activator"
      @click="isOpen = !isOpen"
      append-icon="mdi-chevron-down"
      >{{ title }}</v-btn
    >
    <Widget :dense="dense" v-show="isOpen">
      <slot v-if="eager || isOpen"></slot>
    </Widget>
  </span>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

defineProps<{
  title?: string
  dark?: boolean
  eager?: boolean
  right?: boolean
  dense?: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open'): void
}>()

const isOpen = ref(false)
watch(isOpen, async (value) => {
  await nextTick()
  if (value) emit('open')
  else emit('close')
})

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

defineExpose({
  close
})
</script>

<style lang="sass">
.btn-dropdown
  position: relative
  > button
    &:focus
      outline: none
    .mdi
      transition: transform .2s
  > .widget
    position: absolute
    left: 0
    min-width: 200px
    z-index: 100
  &.right > .widget
    right: 0
    left: initial
  &.isOpen
    > button .mdi-chevron-down
      transform: rotate(180deg)
</style>
