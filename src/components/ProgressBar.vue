<template>
  <div class="progress-bar" :class="{ failed, done }">
    <div class="bar" :style="{ width: `${value / total * 100}%` }">
      <span>{{ textDisplay }}</span>
    </div>
  </div>
</template>

<script>
export default {
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
  computed: {
    textDisplay () {
      if (this.text) {
        return this.text
      }
      if (this.absolute) {
        return `${this.value} / ${this.total}`
      }
      return `${Math.floor(this.value / this.total * 100)} %`
    }
  }
}
</script>

<style lang="sass">
.progress-bar
  width: 100%
  border: 1px solid #444
  border-radius: 3px
  margin: 0 auto
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
