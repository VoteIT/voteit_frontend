<template>
  <div>
    <p>
      {{ t('poll.schulze.numTiedWinners', tiedWinners.length, { count: tiedWinners.length }) }}
    </p>
    <p v-if="tiedWinners.length">
      {{ tiedWinners.join(', ') }}
    </p>
    <v-expansion-panels multiple class="my-4">
      <v-expansion-panel v-for="{ btn, proposal, pairs } in candidatePairs" :key="proposal.pk">
        <v-expansion-panel-title>
          <v-icon v-bind="btn" class="mr-4" />
          <Tag disabled :name="proposal.prop_id" />
        </v-expansion-panel-title>
        <v-expansion-panel-text v-for="pair in pairs" :key="`${proposal.pk} vs ${pair.proposal.pk}`" class="my-2">
          {{ t('poll.result.versus') }}: <Tag disabled :name="pair.proposal.prop_id" />
          <div class="d-flex justify-space-between mt-2">
            <span class="bg-success px-2 rounded-pill">{{ t('poll.result.approveThis') }} ({{ pair.approve }})</span>
            <span class="bg-secondary px-2 rounded-pill">{{ t('poll.result.tie') }} ({{ pair.tie }})</span>
            <span class="bg-warning px-2 rounded-pill">{{ t('poll.result.approveOther') }} ({{ pair.deny }})</span>
          </div>
          <div class="d-flex mt-1 overflow-hidden rounded">
            <div v-for="({ percentage, color }, i) in pair.results" :key="`${proposal.pk} vs ${pair.proposal.pk} ${i}`" :class="`bg-${color}`" class="text-center overflow-hidden text-no-wrap" :style="{ width: `${percentage}%` }">
              {{ Math.round(percentage) }} %
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'

import { ThemeColor } from '@/utils/types'
import { SchulzeResult } from './types'

export default defineComponent({
  props: {
    result: {
      type: Object as PropType<SchulzeResult>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    const tiedWinners = computed(() => {
      if (!props.result.tied_winners) return []
      return props.result.tied_winners.map(pk => {
        const prop = getProposal(pk)
        return prop ? '#' + prop.prop_id : t('proposal.unknown')
      })
    })

    // FIXME Assume total vote count is same as max strength difference for now
    const votes = computed(() => {
      if (props.result.votes) return props.result.votes
      let max = 0
      for (const c of props.result.candidates) {
        for (const o of props.result.candidates.filter(o => o !== c)) {
          const total = strengthMap.value[c][o] + strengthMap.value[o][c]
          if (total > max) max = total
        }
      }
      return max
    })

    const strengthMap = computed(() => {
      const record: Record<number, Record<number, number>> = {}
      for (const [pair, strength] of props.result.pairs) {
        if (!record[pair[0]]) record[pair[0]] = {}
        record[pair[0]][pair[1]] = strength
      }
      return record
    })

    function mapProposal (proposals: number[]) {
      return proposals.map(pk => {
        return {
          proposal: getProposal(pk),
          btn: props.result.approved.includes(pk) ? { icon: 'mdi-thumb-up', color: ThemeColor.Success } : { icon: 'mdi-thumb-down', color: ThemeColor.Warning },
          pairs: props.result.candidates
            .filter(n => n !== pk)
            .map(other => {
              const myStrength = strengthMap.value[pk][other]
              const otherStrength = strengthMap.value[other][pk]
              const tiedStrength = votes.value - myStrength - otherStrength
              return {
                proposal: getProposal(other),
                approve: myStrength,
                tie: tiedStrength,
                deny: otherStrength,
                // Percentages
                results: [
                  {
                    percentage: myStrength / votes.value * 100,
                    color: ThemeColor.Success
                  },
                  {
                    percentage: tiedStrength / votes.value * 100,
                    color: ThemeColor.Secondary
                  },
                  {
                    percentage: otherStrength / votes.value * 100,
                    color: ThemeColor.Warning
                  }
                ]
              }
            })
        }
      })
    }

    const candidatePairs = computed(() => {
      return [...mapProposal(props.result.approved), ...mapProposal(props.result.denied)]
    })
    const pairs = computed(() => props.result.pairs)

    return {
      t,
      candidatePairs,
      pairs,
      tiedWinners,
      getProposal
    }
  }
})
</script>
