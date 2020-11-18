<template>
  <div>
    <div v-if="!progress">
      <button @click="countToTen(true)">Count to 10</button>
      <button @click="countToTen(false)">Fail at 5</button>
      <button @click="countToTen(true, { timeout: 500 })">Short timeout</button>
    </div>
    <progress-bar id="counter-progress" v-else class="progress" :total="progress.total" :value="progress.curr" :done="state" :failed="state === false" :text="progressText" />
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
          return String(this.progress.curr)
      }
    }
  }
}
</script>

<style lang="sass">
#counter-progress
  width: 400px
</style>
