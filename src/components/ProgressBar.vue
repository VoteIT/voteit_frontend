<template>
  <div class="progress-bar" :class="{ failed, done, disabled }">
    <div class="d-flex">
      <div v-if="$slots.default" class="meta flex-grow-1">
        <slot></slot>
      </div>
      <div v-else-if="textDisplay" class="flex-grow-1">
        <span>{{ textDisplay }}</span>
      </div>
      <slot name="right"></slot>
    </div>
    <div class="bar d-flex">
      <div class="progress" :style="{ width: percentage + '%' }"></div>
      <div
        class="buffer"
        v-if="buffer"
        :style="{ width: bufferPercentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    text?: string
    absolute?: boolean
    failed?: boolean
    done?: boolean
    total?: number
    value?: number
    buffer?: number
  }>(),
  {
    value: 0,
    buffer: 0
  }
)

const disabled = computed(() => {
  return !props.total
})

const bufferPercentage = computed(() => {
  if (!props.total) return 0
  return (props.buffer / props.total) * 100
})

const percentage = computed(() => {
  if (!props.total) return 0
  return (props.value / props.total) * 100
})

const textDisplay = computed(() => {
  if (props.text) return props.text
  if (disabled.value) return
  if (props.absolute) return `${props.value} / ${props.total}`
  return `${Math.floor(percentage.value)} %`
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
