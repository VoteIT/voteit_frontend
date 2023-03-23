<template>
  <div>
    <v-alert v-if="pollTied" type="info" class="mt-4 mb-8" :text="t('poll.majority.tiedResult')" />
    <Proposal
      v-for="{ icon, proposal, votes } in proposalResults"
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
  </div>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'
import useProposals from '@/modules/proposals/useProposals'
import type { MajorityResult, ResultProps } from './types'
import type { Proposal } from '@/modules/proposals/types'

const { t } = useI18n()
const { getProposal } = useProposals()

const props = defineProps<ResultProps<MajorityResult>>()

function getIcon (proposal: number) {
  if (props.result.approved.includes(proposal)) return { icon: 'mdi-thumb-up', color: ThemeColor.Success, text: t('proposal.approved') }
  if (props.result.denied.includes(proposal)) return { icon: 'mdi-thumb-down', color: ThemeColor.Warning, text: t('proposal.denied') }
  return { icon: 'mdi-help-rhombus', color: ThemeColor.Secondary, text: t('proposal.tied') }
}

function isProposal (prop?: Proposal): prop is Proposal {
  return !!prop
}

const pollTied = computed(() => props.result.approved.length === 0)

const proposalResults = computed(() => {
  return orderBy(
    props.proposals
      .map(getProposal)
      .filter(isProposal)
      .map(proposal => ({
        proposal,
        votes: props.result.results.find(r => r.proposal === proposal.pk)?.votes || 0,
        icon: getIcon(proposal.pk)
      })),
    ['votes'], ['desc']
  )
})
</script>
