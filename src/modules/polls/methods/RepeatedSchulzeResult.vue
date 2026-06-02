<script setup lang="ts">
import { computed } from 'vue'

import useProposalStore from '@/modules/proposals/useProposalStore'
import ProposalSheet from '@/modules/proposals/ProposalSheet.vue'

import { RepeatedSchulzePoll } from './types'
import SchulzeResult from './SchulzeResult.vue'

const props = defineProps<{
  abstainCount: number
  proposals: number[]
  result: NonNullable<RepeatedSchulzePoll['result']>
}>()

const { getProposal } = useProposalStore()

const orderedProposals = computed(() =>
  props.result.rounds.map((round) => getProposal(round.winner) ?? round.winner)
)
</script>

<template>
  <div>
    <div class="d-flex flex-column ga-2 my-6">
      <div
        v-for="(proposal, i) in orderedProposals"
        :key="i"
        class="d-flex ga-1"
      >
        <v-sheet color="success" class="d-flex px-2 py-3 text-h5" rounded>
          {{ i + 1 }}
        </v-sheet>
        <v-sheet
          v-if="typeof proposal === 'number'"
          class="flex-grow-1 pa-4"
          rounded
        >
          <em>{{ $t('proposal.unknown') }}: {{ proposal }}</em>
        </v-sheet>
        <ProposalSheet v-else class="flex-grow-1" :proposal="proposal" />
      </div>
    </div>
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

<style lang="sass" scoped>
.ordinal
  float: right
  position: relative
  top: -10px
  font-weight: 700
  font-size: 20pt
</style>
