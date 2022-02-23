<template>
  <div class="page-dropdown">
    <v-btn prepend-icon="mdi-chevron-right" variant="text" block @click="toggle()" class="collapse" :class="{ isOpen }">
      {{ title }}
    </v-btn>
    <v-expand-transition>
      <div class="dropdown-content" v-show="isOpen">
        <slot/>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: {
    modelValue: Boolean,
    tag: {
      type: String,
      default: 'h2'
    },
    title: String
  },
  setup (props, { emit }) {
    const isOpen = ref(props.modelValue)
    function toggle () {
      isOpen.value = !isOpen.value
      emit('update:modelValue', isOpen.value)
    }

    return {
      isOpen,
      toggle
    }
  }
})
</script>

<style lang="sass">
.page-dropdown
  .collapse
    justify-content: left
    font-size: 12pt
    font-weight: normal
    .mdi-chevron-right
      transform: rotate(0deg)
      transition: transform .2s
    &.isOpen .mdi-chevron-right
      transform: rotate(90deg)
  .dropdown-content
    padding-top: 1em
</style>
