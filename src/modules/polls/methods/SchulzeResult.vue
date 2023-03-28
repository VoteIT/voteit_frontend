<template>
  <div>
    <p v-if="!result.winner">
      <!-- On deny win, there will be no winning proposals -->
      {{ t('poll.schulze.allDenied') }}
    </p>
    <p v-else>
      {{ t('poll.schulze.numTiedWinners', tiedWinners.length) }}
    </p>
    <p v-if="tiedWinners.length" class="my-2">
      <Tag v-for="tag, i in tiedWinners" :key="i" class="mr-1" :name="tag" disabled />
    </p>
    <v-expansion-panels multiple class="my-4">
      <v-expansion-panel v-for="{ btn, proposal, pairs } in proposalPairs" :key="proposal?.pk ?? 0">
        <v-expansion-panel-title>
          <v-icon v-bind="btn" class="mr-4" />
          <Tag v-if="proposal" disabled :name="proposal.prop_id" />
          <span v-else class="rounded bg-warning px-2 py-1">{{ t('poll.deny') }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text v-for="pair in pairs" :key="`${proposal?.pk ?? 0} vs ${pair.proposal?.pk ?? 0}`" class="my-2">
          {{ t('poll.result.versus') }}:
            <Tag v-if="pair.proposal" disabled :name="pair.proposal.prop_id" />
            <span v-else class="rounded bg-warning px-2">{{ t('poll.deny') }}</span>
          <div class="d-flex justify-space-between mt-2">
            <span class="bg-success px-2 rounded-pill">{{ t('poll.result.approveThis') }} ({{ pair.approve }})</span>
            <span class="bg-secondary px-2 rounded-pill">{{ t('poll.result.tie') }} ({{ pair.tie }})</span>
            <span class="bg-warning px-2 rounded-pill">{{ t('poll.result.approveOther') }} ({{ pair.deny }})</span>
          </div>
          <div class="d-flex mt-1 overflow-hidden rounded">
            <div v-for="({ percentage, color }, i) in pair.results" :key="`${proposal?.pk ?? 0} vs ${pair.proposal?.pk ?? 0} ${i}`" :class="`bg-${color}`" class="text-center overflow-hidden text-no-wrap" :style="{ width: `${percentage}%` }">
              {{ Math.round(percentage) }} %
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'

import { ThemeColor } from '@/utils/types'
import { SchulzeResult } from './types'

const props = defineProps<{
  abstainCount: number
  proposals: number[]
  result: SchulzeResult
}>()

const { t } = useI18n()
const { getProposal } = useProposals()

const tiedWinners = computed(() => {
  if (!props.result.tied_winners) return []
  return props.result.tied_winners.map(pk => {
    const prop = getProposal(pk)
    return prop
      ? prop.prop_id
      : t('proposal.unknown')
  })
})

const strengthMap = computed(() => {
  const record: Record<number, Record<number, number>> = {}
  for (const [pair, strength] of props.result.pairs) {
    if (!record[pair[0]]) record[pair[0]] = {}
    record[pair[0]][pair[1]] = strength
  }
  return record
})

const sortedProposals = computed(() => {
  const proposals = [...props.result.approved, ...props.result.denied]
  return proposals.length === props.result.candidates.length
    ? proposals
    : props.result.candidates
})

const proposalCombinations = computed(() => {
  // All possible combinations of proposals
  return sortedProposals.value.flatMap(
    (one, i) => sortedProposals.value.slice(i + 1).map(other => [one, other])
  )
})

const voteCount = computed(() => {
  // If no vote count from backend, calculate minimum value for this poll.
  // (To handle historic repeated schulze rounds)
  return props.result.vote_count
    ? props.result.vote_count
    : Math.max(...proposalCombinations.value.map(([one, other]) => strengthMap.value[one][other] + strengthMap.value[other][one]))
})

function mapProposal (proposals: number[]) {
  return proposals.map(pk => {
    return {
      proposal: getProposal(pk),
      btn: props.result.winner === pk
        ? { icon: 'mdi-thumb-up', color: ThemeColor.Success }
        : { icon: 'mdi-thumb-down', color: ThemeColor.Warning },
      pairs: props.result.candidates
        .filter(n => n !== pk)
        .map(other => {
          const myStrength = strengthMap.value[pk][other]
          const otherStrength = strengthMap.value[other][pk]
          const tiedStrength = voteCount.value - myStrength - otherStrength
          return {
            proposal: getProposal(other),
            approve: myStrength,
            tie: tiedStrength,
            deny: otherStrength,
            // Percentages
            results: [
              {
                percentage: myStrength / voteCount.value * 100,
                color: ThemeColor.Success
              },
              {
                percentage: tiedStrength / voteCount.value * 100,
                color: ThemeColor.Secondary
              },
              {
                percentage: otherStrength / voteCount.value * 100,
                color: ThemeColor.Warning
              }
            ]
          }
        })
    }
  })
}

const proposalPairs = computed(() => {
  return mapProposal(sortedProposals.value)
})
</script>
