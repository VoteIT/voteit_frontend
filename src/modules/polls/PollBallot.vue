<script setup lang="ts" generic="TPoll extends Poll">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { openAlertEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import { socket } from '@/utils/Socket'

import { Proposal } from '../proposals/types'

import { Poll } from './types'
import { pollPlugins } from './registry'
import { voteType } from './contentTypes'

const props = defineProps<{
  disabled?: boolean
  poll: TPoll
  proposals: Proposal[]
  modelValue?: object
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', vote?: object): void
  (e: 'votingComplete'): void
}>()

const { t } = useI18n()

const pollPlugin = computed(() => pollPlugins.getPlugin(props.poll.method_name))
const voteComponent = computed(() => pollPlugin.value?.voteComponent)
const pollHelpText = computed(() => pollPlugin.value?.getHelp(t))

const validVote = ref(props.modelValue) // Gets updates from method vote component, when valid.
const submitting = ref(false)
async function castVote() {
  if (!validVote.value) return
  submitting.value = true
  const msg = {
    poll: props.poll.pk,
    vote: validVote.value
  }
  try {
    await socket.call(`${props.poll.method_name}_vote.add`, msg)
    emit('votingComplete')
  } catch (e) {
    openAlertEvent.emit(
      '^Critical error. Your vote was not accepted! Try again, or contact a meeting offical!'
    )
  }
  submitting.value = false
}

async function abstainVote() {
  if (validVote.value) {
    if (
      !(await dialogQuery({
        title: t('poll.abstainValidVoteConfirm'),
        no: t('cancel'),
        yes: t('poll.abstain'),
        theme: ThemeColor.Warning
      }))
    ) {
      return
    }
  }
  submitting.value = true
  try {
    await voteType.methodCall('abstain', { poll: props.poll.pk })
    validVote.value = undefined
    emit('votingComplete')
  } catch (e) {
    openAlertEvent.emit(
      '^Critical error. Your abstain vote was not accepted! Try again, or contact a meeting offical!'
    )
  }
  submitting.value = false
}
</script>

<template>
  <div>
    <v-alert
      type="info"
      class="my-6"
      :color="disabled ? 'secondary' : undefined"
    >
      {{ pollHelpText }}
    </v-alert>
    <component
      class="voting-component"
      :disabled="disabled"
      :is="voteComponent"
      :poll="poll"
      :proposals="proposals"
      v-model="validVote"
    />
    <div v-if="!disabled" class="mt-6 d-flex align-end">
      <v-btn
        color="primary"
        size="large"
        :disabled="!validVote"
        :loading="submitting"
        @click="castVote"
        prepend-icon="mdi-vote"
      >
        {{ t('poll.vote') }}
      </v-btn>
      <v-btn
        color="warning"
        :loading="submitting"
        @click="abstainVote"
        prepend-icon="mdi-cancel"
        class="ml-1"
      >
        {{ t('poll.abstain') }}
      </v-btn>
    </div>
  </div>
</template>
