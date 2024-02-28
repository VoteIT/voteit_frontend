<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PollStatus } from './types'
import ProgressBar from '@/components/ProgressBar.vue'

defineProps<{
  pollStatus?: PollStatus
}>()

const { t } = useI18n()
</script>

<template>
  <ProgressBar
    v-if="pollStatus"
    class="my-4"
    :value="pollStatus.voted"
    :total="pollStatus.total"
  >
    <span>{{
      t(
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
