<template>
  <div class="btn-dropdown" :class="{ dark }">
    <btn :class="{ isOpen }" @click="isOpen = !isOpen" icon="arrow_drop_down">{{ title }}</btn>
    <div v-show="isOpen">
      <slot v-if="!lazy || isOpen" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue'

export default defineComponent({
  name: 'BtnDropdown',
  emits: ['open', 'close'],
  props: {
    title: String,
    dark: Boolean,
    lazy: Boolean
  },
  setup (props, { emit }) {
    const isOpen = ref(false)
    watch(isOpen, value => {
      nextTick(() => emit(value ? 'open' : 'close'))
    })

    return {
      isOpen
    }
  }
})
</script>

<style lang="sass">
.btn-dropdown
  > button
    padding-right: 1rem
    &:focus
      outline: none
    .material-icons
      transition: transform .2s
    &.isOpen
      border-bottom-left-radius: 0
      border-bottom-right-radius: 0
      background-color: var(--widget-bg)
      .material-icons
        transform: rotate(180deg)
  > div
    border-radius: 0 6px 6px 6px
    background-color: var(--widget-bg)
    border-radius: 0 10px 10px 10px
    padding: .5rem
  &.dark
    > button.isOpen,
    > div
      background-color: var(--widget-alt-bg)
</style>
