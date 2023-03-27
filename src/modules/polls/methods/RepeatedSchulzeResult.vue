<template>
  <div>
    <Proposal v-for="proposal, i in orderedProposals" :key="proposal.pk" :selected="proposal && result.approved.includes(proposal.pk)" :p="proposal" read-only class="my-4">
      <template #top>
        <span class="ordinal">{{ i+1 }}</span>
      </template>
    </Proposal>
    <v-expansion-panels>
      <v-expansion-panel v-for="(round, i) in result.rounds" :key="i" :title="t('poll.result.roundNum', i+1)">
        <v-expansion-panel-text>
          <SchulzeResult :proposals="round.candidates" :result="round" :abstainCount="abstainCount" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import type { Proposal } from '@/modules/proposals/types'

import { RepeatedSchulzeResult, ResultProps } from './types'
import SchulzeResult from './SchulzeResult.vue'

interface Props extends ResultProps { result: RepeatedSchulzeResult }
const props = defineProps<Props>()

const { t } = useI18n()
const { getProposal } = useProposals()

const orderedProposals = computed(() => {
  return props.result.rounds
    .map(round => getProposal(round.winner))
    .filter((p?: Proposal): p is Proposal => !!p)
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
