<script setup lang="ts">
/**
 * This if a fully passive poll modal used in passive (projector) mode.
 * It will only ever show poll selected in bradcast view.
 * It may be closed by user, though, for example if they need to disable passive mode.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import ProgressBar from '@/components/ProgressBar.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import usePoll from '../polls/usePoll'
import { pollType } from '../polls/contentTypes'

import useRoom from './useRoom'

const props = defineProps<{
  pollId: number
}>()

const { t } = useI18n()
const { idle } = useIdle(5_000)

const currentPollId = computed(() => props.pollId)
const { meetingRoom } = useRoom()
const {
  isOngoing,
  isFinished,
  isWithheld,
  poll,
  pollMethodName,
  pollStatus,
  proposals,
  resultComponent,
  voteComponent
} = usePoll(currentPollId)

// Only follow if ongoing
useChannel(
  'poll',
  computed(() => (isOngoing.value ? props.pollId : undefined))
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
</script>

<template>
  <DefaultDialog :model-value="true" :persistent="idle" :title="poll?.title">
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <div v-if="!poll" class="my-8 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <template v-else-if="isOngoing">
      <main>
        <p class="mb-4">
          {{
            t('poll.pollDescription', {
              method: pollMethodName,
              count: proposals.length
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
          v-if="poll?.withheld_result"
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
      <p class="mb-4">
        {{ t('poll.result.method', { method: pollMethodName }) }}
      </p>
      <div v-if="isFinished">
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
        <WorkflowState :content-type="pollType" :object="poll" />
      </p>
    </main>
  </DefaultDialog>
</template>

<style lang="sass">
span.active
  .mdi
    display: inline-block
    background-color: rgb(var(--v-theme-success))
    border-radius: 4px
    text-align: center
    width: 18px
    height: 18px
</style>
