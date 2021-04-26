<template>
  <div class="progress-bar" :class="{ failed, done }">
    <div class="bar">
      <div class="progress" :style="{ width: percentage + '%' }" />
    </div>
    <div v-if="$slots.default || textDisplay" class="meta">
      <span>{{ textDisplay }}</span>
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'Progress bar',
  props: {
    text: String,
    absolute: Boolean,
    failed: Boolean,
    done: Boolean,
    total: {
      type: Number,
      default: 1
    },
    value: {
      type: Number,
      default: 0
    }
  },
  setup (props) {
    const percentage = computed(() => {
      if (props.total === 0) {
        return 0
      }
      return props.value / props.total * 100
    })
    const textDisplay = computed(() => {
      if (props.text) {
        return props.text
      }
      if (props.absolute) {
        return `${props.value} / ${props.total}`
      }
      return Math.floor(percentage.value * 100) + ' %'
    })

    return {
      percentage,
      textDisplay
    }
  }
})
</script>

<style lang="sass">
.progress-bar
  margin: 0 auto
  .bar
    margin: .5em 0
    background-color: rgb(var(--v-theme-on-background))
  .progress
    box-sizing: border-box
    background-color: rgb(var(--v-theme-success))
    height: 3px
    transition: background-color .2s, width .1s
  .meta
    display: flex
    justify-content: space-between
    color: rgb(var(--v-theme-secondary))
    font-size: 10.5pt
  &.failed
    .progress
      background-color: rgb(var(--v-theme-error))
    .progress-text
      color: rgb(var(--v-theme-error))
  &.done
    .progress
      background-color: rgb(var(--v-theme-primary))
    .progress-text
      color: rgb(var(--v-theme-primary))
</style>
