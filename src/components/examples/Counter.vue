<template>
  <div>
    <div v-if="!counting">
      <button @click="countToTen(true)">Count to 10</button>
      <button @click="countToTen(false)">Fail at 5</button>
      <button @click="countToTen(true, { timeout: 500 })">Short timeout</button>
    </div>
    <progress-bar v-else id="counter-progress" class="progress" :total="progress.total" :value="progress.curr" :done="state" :failed="state === false" :text="progressText" />
  </div>
</template>

<script lang="ts">
import useChannels from '@/composables/useChannels'
import { Progress } from '@/utils/types'
import { computed, defineComponent, ref } from 'vue'

const PROGRESS_DEFAULT: Progress = {
  curr: 0,
  total: 1
}

export default defineComponent({
  name: 'Counter',
  setup () {
    const { post } = useChannels('testing', { alertOnError: false }) // Handle errors here

    const progress = ref<Progress>(PROGRESS_DEFAULT)
    const state = ref<boolean | null>(null)
    const counting = ref(false)

    function countToTen (succeed: boolean, config: Object) {
      const data = succeed ? undefined : { fail: 5 }
      counting.value = true
      post('testing.count', data, config)
        .onProgress((value: Progress) => {
          progress.value = value
        })
        .then(({ p }) => {
          progress.value = p as Progress
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
            progress.value = PROGRESS_DEFAULT
            state.value = null
            counting.value = false
          }, 2000)
        })
    }

    const progressText = computed(() => {
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
      progressText,
      counting
    }
  }
})
</script>

<style lang="sass">
#counter-progress
  width: 400px
</style>
