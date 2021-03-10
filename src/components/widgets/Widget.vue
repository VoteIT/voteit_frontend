<template>
  <div class="widget" :class="{ selected }">
    <slot/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    selected: Boolean
  }
})
</script>

<style lang="sass">
.widget
  margin-bottom: 1rem
  background-color: var(--widget-bg)
  border: var(--widget-border)
  border-radius: 6px
  padding: 10px
  h2
    margin-top: 0
  .btn-controls
    text-align: right
  &.selected
    background-color: var(--widget-selected-bg)
</style>
