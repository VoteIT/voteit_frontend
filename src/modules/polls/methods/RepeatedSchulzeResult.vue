<template>
  <div>
    <ProposalCard
      v-for="(proposal, i) in orderedProposals"
      :key="proposal.pk"
      :selected="proposal && result.approved.includes(proposal.pk)"
      :p="proposal"
      read-only
      class="my-4"
    >
      <template #top>
        <span class="ordinal">{{ i + 1 }}</span>
      </template>
    </ProposalCard>
    <v-expansion-panels>
      <v-expansion-panel
        v-for="(round, i) in result.rounds"
        :key="i"
        :title="$t('poll.result.roundNum', i + 1)"
      >
        <v-expansion-panel-text>
          <SchulzeResult
            :proposals="round.candidates"
            :result="round"
            :abstainCount="abstainCount"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useProposals from '@/modules/proposals/useProposals'
import ProposalCard from '@/modules/proposals/ProposalCard.vue'
import type { Proposal as P } from '@/modules/proposals/types'

import { RepeatedSchulzeResult } from './types'
import SchulzeResult from './SchulzeResult.vue'

const props = defineProps<{
  abstainCount: number
  proposals: number[]
  result: RepeatedSchulzeResult
}>()

const { getProposal } = useProposals()

const orderedProposals = computed(() => {
  return props.result.rounds
    .map((round) => getProposal(round.winner))
    .filter((p?: P): p is P => !!p)
})
</script>

<style lang="sass" scoped>
.ordinal
  float: right
  position: relative
  top: -10px
  font-weight: 700
  font-size: 20pt
</style>
