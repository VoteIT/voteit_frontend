<template>
  <div>
    <div v-if="!counting">
      <v-btn color="primary" text="Count to 10" @click="countToTen(true)" />
      <v-btn color="primary" text="Fail at 5" @click="countToTen(false)" />
    </div>
    <ProgressBar
      v-else
      id="counter-progress"
      class="progress"
      :total="progress.total"
      :value="progress.curr"
      :done="!!state"
      :failed="state === false"
      :text="progressText"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ContentType from '@/contentTypes/ContentType'
import { Progress } from '@/utils/types'
import ProgressBar from '../ProgressBar.vue'

const PROGRESS_DEFAULT: Progress = {
  curr: 0,
  total: 1
}

const testingType = new ContentType({ name: 'testing' })
const progress = ref<Progress>(PROGRESS_DEFAULT)
const state = ref<boolean | null>(null)
const counting = ref(false)

function countToTen(succeed: boolean) {
  const data = succeed ? undefined : { fail: 5 }
  counting.value = true

  testingType
    .methodCall<Progress>('count', data, { alertOnError: false })
    .onProgress((value) => {
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
</script>

<style lang="sass">
#counter-progress
  width: 400px
</style>
