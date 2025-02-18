<script setup lang="ts">
import ProgressBar from '@/components/ProgressBar.vue'
import { PollStatus } from './types'

defineProps<{
  pollStatus?: PollStatus
}>()
</script>

<template>
  <ProgressBar
    v-if="pollStatus"
    class="my-4"
    :value="pollStatus.voted"
    :total="pollStatus.total"
  >
    <span>{{
      $t(
        'poll.votedProgress',
        {
          ...pollStatus,
          percentage: Math.round((pollStatus.voted / pollStatus.total) * 100)
        },
        pollStatus.voted
      )
    }}</span>
  </ProgressBar>
</template>
