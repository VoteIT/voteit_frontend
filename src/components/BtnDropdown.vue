<template>
  <span class="btn-dropdown" :class="{ dark, isOpen, right }" @keydown.esc.prevent="isOpen = false">
    <slot name="activator" :toggle="toggle"/>
    <v-btn v-if="title && !$slots.activator" @click="isOpen = !isOpen" append-icon="mdi-chevron-down">{{ title }}</v-btn>
    <Widget :dense="dense" v-show="isOpen">
      <slot v-if="!lazy || isOpen" />
    </Widget>
  </span>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue'

export default defineComponent({
  name: 'BtnDropdown',
  emits: ['open', 'close'],
  props: {
    title: String,
    dark: Boolean,
    lazy: Boolean,
    right: Boolean,
    dense: Boolean
  },
  setup (props, { emit }) {
    const isOpen = ref(false)
    watch(isOpen, value => {
      nextTick(() => emit(value ? 'open' : 'close'))
    })
    function toggle () {
      isOpen.value = !isOpen.value
    }
    function close () {
      isOpen.value = false
    }

    return {
      isOpen,
      close,
      toggle
    }
  }
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
