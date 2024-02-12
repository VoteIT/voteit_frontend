<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useChannel from '@/composables/useChannel'
import ProgressBar from '@/components/ProgressBar.vue'

import { Poll } from '../polls/types'
import usePoll from '../polls/usePoll'
import { pollType } from '../polls/contentTypes'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useRoom from './useRoom'
import { useIdle } from '@vueuse/core'

const props = defineProps<{
  poll: Poll
}>()

const { t } = useI18n()
const { idle } = useIdle(5_000)

const pollId = computed(() => props.poll.pk)
const { meetingRoom } = useRoom()
const {
  isOngoing,
  isFinished,
  isWithheld,
  pollMethodName,
  pollStatus,
  proposals,
  resultComponent,
  voteComponent
} = usePoll(pollId)

// Only follow if ongoing
useChannel(
  'poll',
  computed(() => (isOngoing.value ? pollId.value : undefined))
)

const complete = computed(() => {
  if (!pollStatus.value) return false
  return pollStatus.value.voted === pollStatus.value.total
})

const progressText = computed(() => {
  if (!pollStatus.value) return ''
  return t(
    'poll.numVoted',
    pollStatus.value as Record<string, any>,
    pollStatus.value.voted
  )
})

const progressBar = computed(() => {
  if (!pollStatus.value) return
  return {
    value: pollStatus.value.voted,
    total: pollStatus.value.total,
    text: progressText.value,
    done: complete.value
  }
})

const { getState } = pollType.useWorkflows()
const pollStateText = computed(() => getState(props.poll.state)?.getName(t))
</script>

<template>
  <template v-if="isOngoing">
    <main class="mb-8">
      <p>
        {{
          t('poll.pollDescription', {
            method: pollMethodName,
            count: poll.proposals.length
          })
        }}
      </p>
      <ProgressBar
        v-if="progressBar"
        v-bind="progressBar"
        absolute
        class="mt-8"
      />
      <v-alert
        v-if="poll.withheld_result"
        :text="t('poll.result.willBeWithheld')"
        type="info"
        class="my-6"
      />
    </main>
    <DefaultDialog
      :model-value="meetingRoom?.show_ballot"
      :persistent="idle"
      :title="t('poll.ballot')"
      width="600px"
    >
      <component
        :is="voteComponent"
        disabled
        :poll="poll"
        :proposals="proposals"
      />
    </DefaultDialog>
  </template>
  <main v-else>
    <div v-if="isFinished" class="mt-6">
      <component
        :is="resultComponent"
        :result="poll.result"
        :abstain-count="poll.abstain_count"
        :proposals="poll.proposals"
      />
    </div>
    <v-alert
      v-else-if="isWithheld"
      class="mt-6"
      :text="t('poll.result.withheldExplanation')"
      type="info"
    />
    <p v-else class="my-2">
      {{ pollStateText }}
    </p>
  </main>
</template>
