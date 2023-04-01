<template>
  <template v-if="poll && isOngoing">
    <main>
      <p>{{ t('poll.pollDescription', { method: t(`poll.method.${poll.method_name}`), count: poll.proposals.length }) }}</p>
      <ProgressBar v-if="progressBar" v-bind="progressBar" absolute class="mt-8" />
    </main>
    <div class="actions text-right mt-6">
      <v-btn variant="text" :disabled="working" color="warning" prepend-icon="mdi-cancel" @click="cancel()" class="mr-1">
        {{ t('poll.cancel') }}
      </v-btn>
      <v-btn variant="text" :disabled="working" color="primary" prepend-icon="mdi-gavel" @click="close()">
        {{ t('poll.close') }}
      </v-btn>
    </div>
  </template>
  <main v-else-if="poll">
    {{ t(`workflowState.${poll.state}`) }}
    <div v-if="isFinished" class="my-6">
      <component :is="resultComponent" :result="poll.result" :abstain-count="poll.abstain_count" :proposals="poll.proposals" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ProgressBar from '@/components/ProgressBar.vue'
import usePoll from '@/modules/polls/usePoll'
import { Poll, PollTransition } from '../polls/types'
import { pollType } from '../polls/contentTypes'

const props = defineProps<{ data: Poll }>()

const { t } = useI18n()
const { isOngoing, isFinished, poll, pollStatus, resultComponent } = usePoll(ref(props.data.pk))

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

onBeforeMount(() => {
  pollType.channel.subscribe(props.data.pk)
})
onBeforeUnmount(() => {
  pollType.channel.leave(props.data.pk)
})
</script>
