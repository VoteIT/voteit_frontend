<script setup lang="ts">
import { orderBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Tag from '@/components/Tag.vue'
import useProposalStore from '@/modules/proposals/useProposalStore'
import { STVResult } from './types'
import { translateSTVStatus } from './utils'
import ProposalSheet from '@/modules/proposals/ProposalSheet.vue'

const props = defineProps<{
  abstainCount: number
  proposals: number[]
  result: STVResult
}>()

const { getProposal } = useProposalStore()
const { t } = useI18n()

const metadata = computed(() => [
  [t('poll.result.complete'), props.result.complete ? t('yes') : t('no')],
  [t('poll.result.quota'), props.result.quota],
  [t('poll.result.randomized'), props.result.randomized ? t('yes') : t('no')]
])

function pkToPropId(pk: number) {
  return getProposal(pk)?.prop_id ?? t('unknown')
}

const approved = computed(() => {
  return props.result.approved.map((id) => getProposal(id) ?? id)
})

const rounds = computed(() => {
  return props.result.rounds.map((round, i) => {
    const voteCount = orderBy(
      round.vote_count.map(([pk, count]) => ({
        count,
        id: pkToPropId(pk),
        pk,
        text: [0, 1].includes(count) // Always plural if not exactly zero or one
          ? t('poll.result.voteCount', count)
          : t(
              'poll.result.voteCount',
              {
                count: count.toLocaleString(undefined, {
                  maximumFractionDigits: 5
                })
              },
              2
            )
      })),
      'count',
      'desc'
    )
    const divideBefore =
      round.status === 'Elected'
        ? voteCount.find(({ pk }) => !round.selected.includes(pk))?.id
        : voteCount.at(-1)?.id
    return {
      ...round,
      divideBefore,
      statusText: translateSTVStatus(round.status, t),
      title: `${t('poll.result.round')} ${i + 1}`,
      proposalIds: round.selected.map(pkToPropId),
      voteCount
    }
  })
})
</script>

<template>
  <div>
    <div class="d-flex flex-column ga-2 my-6">
      <div v-for="(proposal, i) in approved" :key="i" class="d-flex ga-1">
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
    <v-divider class="my-3" />
    <v-list density="comfortable" bg-color="background">
      <v-list-item v-for="[key, value] in metadata" :key="key">
        <v-list-item-subtitle>
          {{ key }}
        </v-list-item-subtitle>
        <v-list-item-title>
          {{ value }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <v-divider class="my-3" />
    <h2>
      {{ $t('poll.result.electionRounds', rounds.length) }}
    </h2>
    <v-expansion-panels class="my-6">
      <v-expansion-panel v-for="round in rounds" :key="round.title">
        <v-expansion-panel-title>
          <div class="text-truncate">
            {{ round.title }}: {{ round.statusText }}
            <Tag
              disabled
              :name="id"
              v-for="id in round.proposalIds"
              :key="id"
              class="mx-1"
            />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list>
            <template v-for="{ pk, id, text } in round.voteCount" :key="id">
              <v-divider v-if="round.divideBefore === id" />
              <v-list-item :disabled="!round.selected.includes(pk)">
                <Tag disabled :name="id" class="mr-2" /> {{ text }}
                <template v-if="round.selected.includes(pk)" #append>
                  <v-icon
                    v-if="round.status === 'Elected'"
                    icon="mdi-check"
                    color="success"
                  />
                  <v-icon v-else icon="mdi-minus" color="warning" />
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
