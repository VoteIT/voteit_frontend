<template>
  <div class="page-dropdown">
    <v-btn prepend-icon="mdi-chevron-right" flat block @click="isOpen = !isOpen" class="collapse" :class="{ isOpen }">
      {{ title }}
    </v-btn>
    <div class="dropdown-content" v-show="isOpen">
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: {
    tag: {
      type: String,
      default: 'h2'
    },
    title: String,
    open: Boolean // Default value
  },
  setup (props) {
    const isOpen = ref(props.open)
    return {
      isOpen
    }
  }
})
</script>

<style lang="sass">
.page-dropdown
  margin-top: 1em
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
