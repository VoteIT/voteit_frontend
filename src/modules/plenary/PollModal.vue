<template>
  <main v-if="!poll" class="text-center">
    <v-progress-circular
      class="my-6"
      color="secondary"
      indeterminate
      size="large"
    />
  </main>
  <template v-else-if="isOngoing">
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
    <div class="actions text-right">
      <DefaultDialog
        :title="t('poll.ballot')"
        @update:model-value="isBroadcasting && setShowBallot($event)"
        width="600px"
      >
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props" prepend-icon="mdi-vote">
            {{ t('poll.showBallot') }}
          </v-btn>
        </template>
        <component
          :is="voteComponent"
          disabled
          :poll="poll"
          :proposals="proposals"
        />
      </DefaultDialog>
      <QueryDialog
        @confirmed="cancel"
        :text="t('poll.confirmCancel')"
        color="warning"
      >
        <template #activator="{ props }">
          <v-btn
            variant="text"
            :disabled="working"
            color="warning"
            prepend-icon="mdi-cancel"
            v-bind="props"
          >
            {{ t('poll.cancel') }}
          </v-btn>
        </template>
      </QueryDialog>
      <v-btn
        variant="elevated"
        :disabled="working"
        color="primary"
        prepend-icon="mdi-gavel"
        @click="close"
      >
        {{ t('poll.close') }}
      </v-btn>
    </div>
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
    <WorkflowState v-else :content-type="pollType" :object="poll" />
  </main>
</template>

<script setup lang="ts">
import { computed, ref, toRef, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import ProgressBar from '@/components/ProgressBar.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'

import usePoll from '../polls/usePoll'
import { Poll, PollTransition } from '../polls/types'
import { pollType } from '../polls/contentTypes'
import useRoom from '../rooms/useRoom'

const props = defineProps<{
  data: Poll
}>()

const { t } = useI18n()
const pollId = toRef(props.data, 'pk')
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
} = usePoll(pollId)
const { isBroadcasting, setPoll, setShowBallot } = useRoom()

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

const working = ref(false)

async function cancel() {
  working.value = true
  await pollType.transitions.make(poll.value!, PollTransition.Cancel, t)
}

async function close() {
  working.value = true
  await pollType.transitions.make(poll.value!, PollTransition.Close, t)
}

/**
 * Unsets active poll in room, whether from created poll or broadcaster clicked to open an existing poll.
 */
onBeforeUnmount(() => {
  if (isBroadcasting.value) setPoll(null)
})
</script>
