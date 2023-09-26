<template>
  <div>
    <Proposal
      v-for="{ choices, proposal } in results"
      :key="proposal.pk"
      :p="proposal"
      readOnly
      class="my-4"
    >
      <template #bottom-right>
        <div class="mt-2 flex-grow-1 text-right">
          <v-btn v-for="{ btn, key, percentage, value } in choices" :key="key" v-bind="btn">
            {{ value }}
            <small v-if="percentage" class="ml-1">
              ({{ percentage }} %)
            </small>
          </v-btn>
        </div>
      </template>
    </Proposal>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { ThemeColor } from '@/utils/types'
import useProposals from '@/modules/proposals/useProposals'
import Proposal from '@/modules/proposals/Proposal.vue'
import type { Proposal as P } from '@/modules/proposals/types'

import { SimpleChoice, CombinedSimpleResult } from './types'
import { simpleChoices } from './simple'

interface ProposalResult {
  proposal: P
  choices: {
    key: string
    percentage?: number
    value: number
    btn: {
      variant: 'text' | 'elevated'
      color: ThemeColor
      prependIcon: string
    }
  }[]
}

const props = defineProps<{
  abstainCount: number
  proposals: number[]
  result: CombinedSimpleResult
}>()

const { getProposal } = useProposals()

function isProposal (prop?: P): prop is P {
  return !!prop
}

function getActiveChoice (pk: number): SimpleChoice | undefined {
  if (props.result.approved.includes(pk)) return SimpleChoice.Yes
  if (props.result.denied.includes(pk)) return SimpleChoice.No
}

function transformResult (proposal: P): ProposalResult {
  const pk = proposal.pk
  const result = props.result.results[pk]
  const total = result[SimpleChoice.Yes] + result[SimpleChoice.No]

  return {
    proposal,
    choices: simpleChoices
      .map(c => {
        const activeChoice = getActiveChoice(pk)
        // Add poll abstain_count to abstains
        const value = c.value === SimpleChoice.Abstain
          ? result[c.value] + props.abstainCount
          : result[c.value]
        const percentage = c.value === SimpleChoice.Abstain
          ? undefined
          : Math.round(value / total * 100)
        return {
          key: c.value,
          percentage,
          value,
          btn: {
            variant: activeChoice === c.value
              ? 'elevated'
              : 'text',
            color: c.color,
            prependIcon: c.icon
          }
        }
      })
  }
}

const results = computed(() => {
  return props.proposals
    .map(getProposal)
    .filter(isProposal)
    .map(transformResult)
})
</script>
