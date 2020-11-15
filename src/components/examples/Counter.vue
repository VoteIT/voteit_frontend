<template>
  <div>
    <div v-if="!progress">
      <button @click="countToTen(true)">Count to 10</button>
      <button @click="countToTen(false)">Fail at 5</button>
      <button @click="countToTen(true, { timeout: 500 })">Short timeout</button>
    </div>
    <div v-else class="progress" :class="{ failed: state === false, done: state }"><div class="bar" :style="{ width: `${progress.curr / progress.total * 100}%` }">
      <span>{{ progressText }}</span>
    </div></div>
  </div>
</template>

<script>
export default {
  name: 'Counter',
  data () {
    return {
      progress: null,
      state: null
    }
  },
  methods: {
    countToTen (succeed, config) {
      const data = succeed ? undefined : { fail: 5 }
      this.$objects.post('testing.count', data, config)
        .onProgress(value => {
          this.progress = value
        })
        .then(({ p }) => {
          this.progress = p
          this.state = true
        })
        .catch(() => {
          this.state = false
          this.progress = {
            curr: 1,
            total: 1
          }
        })
        .finally(() => {
          setTimeout(() => {
            this.progress = null
            this.state = null
          }, 2000)
        })
    }
  },
  computed: {
    progressText () {
      switch (this.state) {
        case true:
          return 'Coming to get you!'
        case false:
          return 'Failed'
        default:
          return this.progress.curr
      }
    }
  }
}
</script>

<style lang="sass">
.progress
  width: 400px
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
  &.failed .bar
    background-color: #b44
    color: #fff
  &.done .bar
    background-color: #4b4
    color: #fff
</style>
