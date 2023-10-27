<template>
  <div v-if="disabled && rankedProposals.length" id="scottish-stv-voting">
    <!-- If already voted -->
    <VoteProposal
      v-for="p in rankedProposals"
      :key="p.pk"
      :proposal="p"
      class="mb-4"
    >
      <template #top>
        <div class="float-right">
          <span class="number">
            {{ ranking.indexOf(p.pk) + 1 }}
          </span>
        </div>
      </template>
    </VoteProposal>
  </div>
  <div v-else id="scottish-stv-voting">
    <VoteProposal v-for="p in proposals" :key="p.pk" :proposal="p" class="mb-4">
      <template #vote>
        <div class="voting-controls" v-if="ranking.includes(p.pk)">
          <div class="left">
            <span class="number">
              {{ ranking.indexOf(p.pk) + 1 }}
            </span>
          </div>
          <div class="center">
            <v-btn
              :disabled="disabled"
              variant="text"
              size="small"
              @click="toggleSelected(p)"
            >
              {{ t('poll.rankingSelectedAs') }}
              {{ ranking.indexOf(p.pk) + 1 || ranking.length + 1 }}
            </v-btn>
          </div>
          <div class="right">
            <v-btn
              :disabled="disabled"
              outlined
              color="primary"
              size="small"
              @click="toggleSelected(p)"
            >
              {{ t('clear') }}
            </v-btn>
          </div>
        </div>
        <div class="voting-controls" v-else>
          <div class="center">
            <v-btn
              :disabled="disabled"
              color="primary"
              @click="toggleSelected(p)"
            >
              {{ t('poll.rankingSelectAs') }}
              {{ ranking.indexOf(p.pk) + 1 || ranking.length + 1 }}
            </v-btn>
          </div>
        </div>
      </template>
    </VoteProposal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getProposals } from '@/modules/proposals/useProposals'
import type { Proposal } from '@/modules/proposals/types'

import { Poll } from '../types'
import { RankedVote } from './types'
import VoteProposal from '@/modules/proposals/VoteProposal.vue'

const props = defineProps<{
  disabled?: boolean
  modelValue?: RankedVote
  poll: Poll
  proposals: Proposal[]
}>()

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:modelValue', vote?: RankedVote): void
}>()

const { t } = useI18n()

const ranking = ref<number[]>(props.modelValue?.ranking ?? [])

function setOrder(order?: number[]) {
  if (order) ranking.value = order
  emit('update:modelValue', { ranking: ranking.value })
}

// TODO: Allow setting min proposals to rank.
const minRanked = computed(() => 1)

function toggleSelected(proposal: Proposal) {
  if (props.disabled) return
  if (ranking.value.includes(proposal.pk)) {
    ranking.value = ranking.value.filter((p) => p !== proposal.pk)
  } else {
    ranking.value.push(proposal.pk)
  }
  if (ranking.value.length >= minRanked.value) setOrder()
  else emit('update:modelValue')
}

const rankedProposals = computed(() => getProposals(ranking.value))
</script>

<style lang="sass">
@keyframes bounce-in
  0%
    transform: scale(1) rotate(0)
  50%
    transform: scale(1.3) rotate(6deg)
  100%
    transform: scale(1) rotate(0)

#scottish-stv-voting
  .header p
    white-space: pre-wrap

  .proposal
    position: relative
    &[data-draggable]
      cursor: grab

  .voting-controls
    display: flex
    align-items: center
    .center
      text-align: center
      flex: 1 0 50%
    .left
      text-align: left
      flex: 0 1 25%
    .right
      text-align: right
      flex: 0 1 25%

  .number
    display: inline-block
    text-align: center
    border-radius: 50%
    width: 23px
    height: 23px
    background-color: rgb(var(--v-theme-success))
    animation: bounce-in .3s
</style>
