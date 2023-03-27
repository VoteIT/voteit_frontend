<template>
  <div>
    <Proposal
      v-for="{ icon, proposal, votes } in results"
      :key="proposal.pk"
      :p="proposal"
      readOnly
      class="my-4"
    >
      <template #bottom-right>
        <p class="text-subtitle flex-grow-1 text-right text-no-wrap text-black mt-2">
          {{ t('poll.result.voteCount', votes) }}
          <v-tooltip location="top right">
            <template #activator="{ props }">
              <v-icon :icon="icon.icon" v-bind="props" :color="icon.color" />
            </template>
            {{ icon.text }}
          </v-tooltip>
        </p>
      </template>
    </Proposal>
    <v-alert :text="t('poll.method.description.dutt')" type="info" icon="mdi-alert-decagram" class="my-2" />
  </div>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '../../proposals/useProposals'
import type { Proposal } from '../../proposals/types'
import type { DuttResult, ResultProps } from './types'

const { t } = useI18n()
const { getProposal } = useProposals()

const PARTIAL_ICONS = [
  'mdi-circle-slice-1',
  'mdi-circle-slice-2',
  'mdi-circle-slice-3',
  // 50 % only on exactly half of the votes
  'mdi-circle-slice-5',
  'mdi-circle-slice-6',
  'mdi-circle-slice-7'
]

function getFractionIcon (fraction: number) {
  // Empty, half and full circles, only for exact values.
  switch (fraction) {
    case 0:
      return 'mdi-circle-outline'
    case 0.5:
      return 'mdi-circle-slice-4'
    case 1:
      return 'mdi-circle-slice-8'
  }
  // Otherwise use a fractional icon.
  return PARTIAL_ICONS[Math.floor(fraction * 6)]
}

interface Props extends ResultProps { result: DuttResult }
const props = defineProps<Props>()

function isProposal (p?: Proposal): p is Proposal {
  return !!p
}

function getIcon (votes: number) {
  const fraction = votes / props.result.vote_count
  const majority = fraction > 0.5
  return {
    color: majority
      ? 'success'
      : 'warning',
    icon: getFractionIcon(fraction),
    text: majority
      ? t('poll.dutt.majorityProposal')
      : t('poll.dutt.minorityProposal')
  }
}

function proposalToResult (proposal: Proposal) {
  const votes = props.result.results.find(r => r.proposal === proposal.pk)?.votes || 0
  return {
    icon: getIcon(votes),
    proposal,
    votes
  }
}

const results = computed(() => {
  return orderBy(
    props.proposals
      .map(getProposal)
      .filter(isProposal)
      .map(proposalToResult),
    ['votes'],
    ['desc']
  )
})
</script>
