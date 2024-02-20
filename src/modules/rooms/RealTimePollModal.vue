<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import ProgressBar from '@/components/ProgressBar.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useMeeting from '../meetings/useMeeting'
import usePoll from '../polls/usePoll'
import { pollType } from '../polls/contentTypes'
import useMeetingPolls from '../polls/useMeetingPolls'

import useRoom from './useRoom'
import PollBallot from '../polls/PollBallot.vue'

const props = defineProps<{
  dismissible: boolean
  pollId?: number
}>()

const emit = defineEmits<{
  (e: 'update:isVoting', value: boolean): void
  (e: 'update:title', value: string): void
}>()

const { t } = useI18n()
const { idle } = useIdle(5_000)

const { meetingId } = useMeeting()
const { firstUnvotedPoll, meetingOngoingPolls } = useMeetingPolls(meetingId)

const currentPollId = ref(
  props.pollId || firstUnvotedPoll.value?.pk || meetingOngoingPolls.value[0].pk
)
const { meetingRoom } = useRoom()
const {
  canVote,
  isOngoing,
  isFinished,
  isWithheld,
  nextUnvoted,
  poll,
  pollMethodName,
  pollStatus,
  proposals,
  resultComponent,
  userVote,
  voteComponent
} = usePoll(currentPollId)

const changeVote = ref(false)
// Reset changeVote when switching poll
watch(currentPollId, () => (changeVote.value = false))

const isVoting = computed(
  () =>
    isOngoing.value && !!canVote.value && (changeVote.value || !userVote.value)
)
watch(isVoting, (value) => emit('update:isVoting', value), { immediate: true })
watch(
  () => poll.value?.title ?? '',
  (title) => emit('update:title', title),
  { immediate: true }
)

// Only follow if ongoing and not currently voting
useChannel(
  'poll',
  computed(() =>
    !isVoting.value && isOngoing.value ? currentPollId.value : undefined
  )
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
    <main>
      <p class="mb-4">
        {{
          t('poll.pollDescription', {
            method: pollMethodName,
            count: proposals.length
          })
        }}
      </p>
      <PollBallot
        v-if="isVoting"
        :model-value="userVote?.vote"
        :poll="poll"
        :proposals="proposals"
        @voting-complete="changeVote = false"
      />
      <ProgressBar
        v-else-if="progressBar"
        v-bind="progressBar"
        absolute
        class="mt-8"
      >
        <template v-if="canVote" #right>
          <span :class="{ active: !!userVote }">
            {{ userVote ? t('poll.youHaveVoted') : t('poll.youHaveNotVoted') }}
            <v-icon size="x-small" icon="mdi-check" />
          </span>
        </template>
      </ProgressBar>
      <v-alert
        v-if="poll?.withheld_result"
        :text="t('poll.result.willBeWithheld')"
        type="info"
        class="my-6"
      />
      <div v-if="(userVote && !changeVote) || nextUnvoted" class="mt-6">
        <v-btn
          v-if="userVote && !changeVote"
          color="secondary"
          class="mr-1"
          prepend-icon="mdi-vote"
          :text="t('poll.viewAndChangeVote')"
          @click="changeVote = true"
        />
        <v-btn
          v-if="nextUnvoted"
          color="primary"
          prepend-icon="mdi-star"
          :text="t('poll.nextUnvoted', { ...nextUnvoted })"
          @click="currentPollId = nextUnvoted.pk"
        />
      </div>
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
      {{ pollStateText }}
    </p>
    <div class="mt-6" v-if="nextUnvoted">
      <v-btn
        v-if="nextUnvoted"
        color="primary"
        prepend-icon="mdi-star"
        :text="t('poll.nextUnvoted', { ...nextUnvoted })"
        @click="currentPollId = nextUnvoted.pk"
      />
    </div>
  </main>
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
