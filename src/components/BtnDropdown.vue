<template>
  <div class="btn-dropdown" :class="{ dark }">
    <Btn :active="isOpen" @click="isOpen = !isOpen" icon="mdi-menu-down">{{ title }}</Btn>
    <Widget v-show="isOpen">
      <slot v-if="!lazy || isOpen" />
    </Widget>
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
    &.bg-accent
      border-bottom-left-radius: 0
      border-bottom-right-radius: 0
      .mdi
        transform: rotate(180deg)
  &.dark .widget
    background-color: var(--widget-alt-bg)
</style>
