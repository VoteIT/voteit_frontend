<template>
  <form @submit.prevent class="my-4">
    <VoteProposal v-for="p in proposals" :key="p.pk" :proposal="p" class="mb-4">
      <template #vote>
        <div class="text-center">
          <v-btn
            :color="option.color"
            :disabled="disabled"
            :prepend-icon="option.icon"
            :text="option.getTitle($t)"
            :variant="choice === p.pk ? 'elevated' : 'outlined'"
            @click="select(p)"
          />
        </div>
      </template>
    </VoteProposal>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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

const emit = defineEmits<{
  (e: 'update:modelValue', vote?: MajorityVote): void
}>()

const choice = ref<number | undefined>(props.modelValue?.choice)

const option = simpleChoices.find((c) => c.value === SimpleChoice.Yes)!

function select(proposal: Proposal) {
  if (props.disabled) return
  choice.value = proposal.pk
  emit('update:modelValue', { choice: choice.value })
}
</script>
