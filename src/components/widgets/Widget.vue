<template>
  <v-sheet elevation="2" class="widget" rounded :class="{ selected }">
    <slot/>
  </v-sheet>
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
  // border: 1px solid rgb(var(--v-border-color))
  background-color: rgb(var(--v-theme-surface))
  padding: 10px
  .btn-controls
    text-align: right
  &.selected
    background-color: rgb(var(--v-theme-surface-active))
</style>
