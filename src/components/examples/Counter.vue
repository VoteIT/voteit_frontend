<template>
  <div>
    <div v-if="!progress">
      <button @click="countToTen(true)">Count to 10</button>
      <button @click="countToTen(false)">Fail at 5</button>
      <button @click="countToTen(true, { timeout: 500 })">Short timeout</button>
    </div>
    <progress-bar v-else id="counter-progress" class="progress" :total="progress.total" :value="progress.curr" :done="state" :failed="state === false" :text="progressText" />
  </div>
</template>

<script>
import useChannels from '@/composables/useChannels.js'
import { computed, ref } from 'vue'

export default {
  name: 'Counter',
  setup () {
    const { post } = useChannels('testing', { alertOnError: false }) // Handle errors here

    const progress = ref(null)
    const state = ref(null)

    function countToTen (succeed, config) {
      const data = succeed ? undefined : { fail: 5 }
      post('testing.count', data, config)
        .onProgress(value => {
          progress.value = value
        })
        .then(({ p }) => {
          progress.value = p
          state.value = true
        })
        .catch(() => {
          state.value = false
          progress.value = {
            curr: 1,
            total: 1
          }
        })
        .finally(() => {
          setTimeout(() => {
            progress.value = null
            state.value = null
          }, 2000)
        })
    }

    const progressText = computed(_ => {
      switch (state.value) {
        case true:
          return 'Coming to get you!'
        case false:
          return 'Failed'
        default:
          return String(progress.value.curr)
      }
    })

    return {
      state,
      progress,
      countToTen,
      progressText
    }
  }
}
</script>

<style lang="sass">
#counter-progress
  width: 400px
</style>
