<template>
  <div class="progress-bar" :class="{ failed, done, disabled }">
    <div v-if="$slots.default" class="meta">
      <slot />
    </div>
    <div v-else-if="textDisplay">
      <span>{{ textDisplay }}</span>
    </div>
    <div class="bar d-flex">
      <div class="progress" :style="{ width: percentage + '%' }" />
      <div class="buffer" v-if="buffer" :style="{ width: bufferPercentage + '%' }" />
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
    total: Number,
    value: {
      type: Number,
      default: 0
    },
    buffer: {
      type: Number,
      default: 0
    }
  },
  setup (props) {
    const disabled = computed(() => {
      return !props.total
    })
    const bufferPercentage = computed(() => {
      if (!props.total) return 0
      return props.buffer / props.total * 100
    })
    const percentage = computed(() => {
      if (!props.total) return 0
      return props.value / props.total * 100
    })
    const textDisplay = computed(() => {
      if (props.text) return props.text
      if (disabled.value) return
      if (props.absolute) return `${props.value} / ${props.total}`
      return `${Math.floor(percentage.value)} %`
    })

    return {
      bufferPercentage,
      disabled,
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
    overflow: hidden
  .progress
    box-sizing: border-box
    background-color: rgb(var(--v-theme-success-lighten-2))
    height: 3px
    transition: background-color .2s, width .1s
  .buffer
    box-sizing: border-box
    background-color: rgba(var(--v-theme-success-lighten-4), .75)
    height: 3px
  .meta
    display: flex
    justify-content: space-between
    color: rgb(var(--v-theme-secondary))
    font-size: 10.5pt
    margin-top: .5em
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
  &.disabled
    .bar
      background-color: rgb(var(--v-border-color))
</style>
