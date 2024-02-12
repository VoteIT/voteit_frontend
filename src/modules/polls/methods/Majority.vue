<template>
  <form @submit.prevent class="my-4">
    <VoteProposal v-for="p in proposals" :key="p.pk" :proposal="p" class="mb-4">
      <template #vote>
        <div class="text-center">
          <v-btn
            :disabled="disabled"
            :color="option.color"
            :variant="choice === p.pk ? 'elevated' : 'outlined'"
            :prepend-icon="option.icon"
            @click="select(p)"
          >
            {{ option.getTitle(t) }}
          </v-btn>
        </div>
      </template>
    </VoteProposal>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Proposal } from '@/modules/proposals/types'

import { MajorityVote, SimpleChoice, SimplePoll } from './types'
import { simpleChoices } from './simple'
import VoteProposal from '@/modules/proposals/VoteProposal.vue'

const props = defineProps<{
  disabled?: boolean
  modelValue?: MajorityVote
  poll: SimplePoll
  proposals: Proposal[]
}>()

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:modelValue', vote?: MajorityVote): void
}>()

const { t } = useI18n()
const choice = ref<number | undefined>(props.modelValue?.choice)

const option = simpleChoices.find((c) => c.value === SimpleChoice.Yes)!

function select(proposal: Proposal) {
  if (props.disabled) return
  choice.value = proposal.pk
  emit('update:modelValue', { choice: choice.value })
}
</script>
