<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogAlert, dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

import { Proposal } from '../proposals/types'

import { Poll } from './types'
import { pollPlugins } from './registry'
import { voteType } from './contentTypes'
import {
  getInvalidVoteDetail,
  getVoteErrorKind,
  translateVoteError
} from './voteErrors'

const props = defineProps<{
  disabled?: boolean
  poll: Poll
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

const retryIcons = {
  timeout: 'mdi-timer-sand',
  network: 'mdi-wifi-alert',
  server: 'mdi-alert-circle-outline'
} as const

/**
 * Sends the vote, offering to try again when that might help.
 * The server upserts votes, so resending one that did get through is safe.
 * Resolves true when the vote was accepted.
 */
async function submitVote(
  msg: Parameters<typeof voteType.api.add>[0]
): Promise<boolean> {
  for (;;) {
    try {
      await voteType.api.add(msg)
      return true
    } catch (e) {
      const kind = getVoteErrorKind(e)
      if (kind === 'rejected') {
        const detail = getInvalidVoteDetail(e)
        await dialogAlert(
          detail
            ? t('poll.voteError.invalid', { detail })
            : translateVoteError(kind, t),
          ThemeColor.Warning
        )
        return false
      }
      const retry = await dialogQuery({
        title: translateVoteError(kind, t),
        icon: retryIcons[kind],
        theme: ThemeColor.Warning,
        yes: t('tryAgain'),
        no: t('cancel')
      })
      if (!retry) return false
    }
  }
}

async function castVote() {
  if (!validVote.value) return
  submitting.value = true
  if (await submitVote({ poll: props.poll.pk, vote: validVote.value }))
    emit('votingComplete')
  submitting.value = false
}

async function abstainVote() {
  if (
    validVote.value &&
    !(await dialogQuery({
      title: t('poll.abstainValidVoteConfirm'),
      no: t('cancel'),
      yes: t('poll.abstain'),
      theme: ThemeColor.Warning
    }))
  ) {
    return
  }
  submitting.value = true
  if (await submitVote({ poll: props.poll.pk, abstain: true })) {
    validVote.value = undefined
    emit('votingComplete')
  }
  submitting.value = false
}
</script>

<template>
  <div>
    <v-alert
      class="my-6"
      :color="disabled ? 'secondary' : undefined"
      :text="pollHelpText"
      type="info"
    />
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
        :disabled="!validVote"
        :loading="submitting"
        prepend-icon="mdi-vote"
        size="large"
        :text="$t('poll.vote')"
        @click="castVote"
      />
      <v-btn
        class="ml-1"
        color="warning"
        :loading="submitting"
        prepend-icon="mdi-cancel"
        :text="$t('poll.abstain')"
        @click="abstainVote"
      />
    </div>
  </div>
</template>
