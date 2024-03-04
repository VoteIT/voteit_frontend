<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import ProgressBar from '@/components/ProgressBar.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useMeeting from '../meetings/useMeeting'
import usePoll from '../polls/usePoll'
import { pollType } from '../polls/contentTypes'
import useRoom from './useRoom'
import useMeetingPolls from '../polls/useMeetingPolls'

const props = defineProps<{
  pollId?: number
}>()

const { t } = useI18n()
const { idle } = useIdle(5_000)

const { meetingId } = useMeeting()
const { meetingOngoingPolls } = useMeetingPolls(meetingId)

const currentPollId = ref(props.pollId || meetingOngoingPolls.value[0].pk)
const { meetingRoom } = useRoom()
const {
  canVote,
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
  computed(() => (isOngoing.value ? currentPollId.value : undefined))
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
const pollStateText = computed(
  () => poll.value && getState(poll.value.state)?.getName(t)
)
</script>

<template>
  <div v-if="!poll" class="my-8 text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <template v-else-if="isOngoing">
    <main class="mb-8">
      <component
        v-if="canVote"
        :is="voteComponent"
        :poll="poll"
        :proposals="proposals"
      />
      <p>
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
