<template>
  <template v-if="poll && isOngoing">
    <main class="mb-8">
      <p>{{ t('poll.pollDescription', { method: pollMethodName, count: poll.proposals.length }) }}</p>
      <ProgressBar v-if="progressBar" v-bind="progressBar" absolute class="mt-8" />
    </main>
    <div class="actions text-right">
      <DefaultDialog :title="t('poll.ballot')">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props" prepend-icon="mdi-vote">
            {{ t('poll.showBallot') }}
          </v-btn>
        </template>
        <component :is="voteComponent" :poll="poll" :proposals="proposals" />
      </DefaultDialog>
      <QueryDialog @confirmed="cancel" :text="t('poll.confirmCancel')" color="warning">
        <template #activator="{ props }">
          <v-btn variant="text" :disabled="working" color="warning" prepend-icon="mdi-cancel" v-bind="props">
            {{ t('poll.cancel') }}
          </v-btn>
        </template>
      </QueryDialog>
      <v-btn variant="elevated" :disabled="working" color="primary" prepend-icon="mdi-gavel" @click="close">
        {{ t('poll.close') }}
      </v-btn>
    </div>
  </template>
  <main v-else-if="poll">
    {{ pollType.useWorkflows().getState(poll.state)?.getName(t) }}
    <div v-if="isFinished" class="my-6">
      <component :is="resultComponent" :result="poll.result" :abstain-count="poll.abstain_count" :proposals="poll.proposals" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ProgressBar from '@/components/ProgressBar.vue'
import usePoll from '@/modules/polls/usePoll'
import { Poll, PollTransition } from '../polls/types'
import { pollType } from '../polls/contentTypes'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useChannel from '@/composables/useChannel'

const props = defineProps<{
  data: Poll
}>()

const { t } = useI18n()
const { isOngoing, isFinished, poll, pollMethodName, pollStatus, proposals, resultComponent, voteComponent } = usePoll(ref(props.data.pk))

useChannel('poll', computed(() => props.data.pk))

useChannel('poll', computed(() => props.data.pk))

const complete = computed(() => {
  if (!pollStatus.value) return false
  return pollStatus.value.voted === pollStatus.value.total
})
const progressText = computed(() => {
  if (!pollStatus.value) return ''
  return t('poll.numVoted', pollStatus.value as Record<string, any>, pollStatus.value.voted)
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

async function cancel () {
  working.value = true
  await pollType.api.transition(props.data.pk, PollTransition.Cancel)
}

async function close () {
  working.value = true
  await pollType.api.transition(props.data.pk, PollTransition.Close)
}
</script>
