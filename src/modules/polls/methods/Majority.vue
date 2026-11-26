<script setup lang="ts">
import { shallowRef } from 'vue'

import type { Proposal } from '@/modules/proposals/types'

import { MajorityVote, SimpleChoice, SimplePoll } from './types'
import { simpleChoices } from './simple'
import VoteProposal from '@/modules/proposals/VoteProposal.vue'

const props = defineProps<{
  disabled?: boolean
  poll: SimplePoll
  proposals: Proposal[]
}>()

const model = defineModel<MajorityVote>()

const choice = shallowRef<number | undefined>(model.value?.choice)

const option = simpleChoices.find((c) => c.value === SimpleChoice.Yes)!

function select(proposal: Proposal) {
  if (props.disabled) return
  choice.value = proposal.pk
  model.value = { choice: choice.value }
}
</script>

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
