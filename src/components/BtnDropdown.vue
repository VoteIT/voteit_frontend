<template>
  <div class="btn-dropdown">
    <btn :class="{ isOpen }" @click="isOpen = !isOpen" icon="arrow_drop_down">{{ title }}</btn>
    <div v-show="isOpen">
      <slot/>
    </div>
  </div>
</template>

<script>
import { nextTick, ref, watch } from 'vue'
export default {
  name: 'BtnDropdown',
  emits: ['open', 'close'],
  props: {
    title: String
  },
  setup (props, { emit }) {
    const isOpen = ref(false)
    watch(isOpen, value => {
      nextTick(_ => emit(value ? 'open' : 'close'))
    })

    return {
      isOpen
    }
  }
}
</script>

<style lang="sass">
.btn-dropdown
  > button
    padding-right: 1rem
    &.isOpen
      border-bottom-left-radius: 0
      border-bottom-right-radius: 0
      background-color: #eee
      transition: transform .2s
      .material-icons
        transform: rotate(180deg)
</style>
