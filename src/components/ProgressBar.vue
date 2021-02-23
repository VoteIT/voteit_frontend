<template>
  <div class="progress-bar" :class="{ failed, done }">
    <div class="bar" :style="{ width: percentage + '%' }">
      <span>{{ textDisplay }}</span>
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
  width: 100%
  border: 1px solid #444
  border-radius: 3px
  margin: 0 auto
  background-color: #fff
  .bar
    box-sizing: border-box
    background-color: #ddd
    height: 1.2em
    color: #000
    transition: background-color .2s, width .1s
    text-align: left
    span
      padding: .1em .4em
      display: inline-block
      white-space: nowrap
  &.failed .bar
    background-color: #b44
    color: #fff
  &.done .bar
    background-color: #4b4
    color: #fff
</style>
