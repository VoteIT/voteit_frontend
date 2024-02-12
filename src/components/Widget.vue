<template>
  <v-sheet elevation="2" class="widget" rounded :class="{ selected, dense }">
    <slot />
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    selected: Boolean,
    dense: Boolean
  }
})
</script>

<style lang="sass">
.widget
  margin-bottom: 1rem
  // border: 1px solid rgb(var(--v-border-color))
  background-color: rgb(var(--v-theme-surface))
  padding: 10px
  &.dense
    padding: 0
  .btn-controls
    text-align: right
  &.selected
    background-color: rgb(var(--v-theme-surface-active))
</style>
