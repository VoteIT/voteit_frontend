<template>
  <div>
    <v-list bg-color="background">
      <v-list-item v-for="(proposal, i) in approved" :key="i">
        <template #prepend>
          <span class="text-h6 mr-4">{{ i + 1 }}.</span>
        </template>
        <v-list-item-title v-if="!proposal">
          - unknown proposal -
        </v-list-item-title>
        <template v-else>
          <v-list-item-title>
            <Tag disabled :name="proposal.prop_id" />
          </v-list-item-title>
          <v-list-item-subtitle>
            <div v-html="proposal.body"></div>
          </v-list-item-subtitle>
        </template>
      </v-list-item>
    </v-list>
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
      {{ t('poll.result.electionRounds', rounds.length) }}
    </h2>
    <v-expansion-panels class="my-6">
      <v-expansion-panel v-for="round in rounds" :key="round.title">
        <v-expansion-panel-title>
          <div class="text-truncate">
            {{ round.title }}: {{ round.status }}
            <Tag disabled :name="id" v-for="id in round.proposalIds" :key="id" class="mx-1" />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list>
            <template v-for="{ id, text } in round.voteCount" :key="id">
              <v-divider v-if="round.divideBefore === id" />
              <v-list-item>
                <Tag disabled :name="id" class="mr-2" /> {{ text }}
              </v-list-item>
            </template>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { orderBy } from 'lodash'
import { computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { ScottishSTVResult } from './types'

const translationMapping: Record<string, string | undefined> = {
  Direct: 'poll.STV.direct',
  Excluded: 'poll.STV.excluded',
  Elected: 'poll.STV.elected',
  'Tiebreak (Random)': 'poll.STV.tiebreakRandom',
  'No competition left': 'poll.STV.noCompetition'
}

const props = defineProps({
  result: {
    type: Object as PropType<ScottishSTVResult>,
    required: true
  }
})

const { getProposal } = useProposals()
const { t } = useI18n()

const metadata = computed(() => [
  [t('poll.result.complete'), props.result.complete ? t('yes') : t('no')],
  [t('poll.result.quota'), props.result.quota],
  [t('poll.result.randomized'), props.result.randomized ? t('yes') : t('no')]
])

function translate (text: string): string {
  const ts = translationMapping[text]
  return ts
    ? t(ts)
    : text
}

function pkToPropId (pk: number) {
  return getProposal(pk)?.prop_id ?? t('unknown')
}

const approved = computed(() => {
  return props.result.approved.map(getProposal)
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
          : t('poll.result.voteCount', { count: count.toLocaleString(undefined, { maximumFractionDigits: 5 }) }, 2)
      })),
      'count',
      'desc'
    )
    const divideBefore = round.status === 'Elected'
      ? voteCount.find(({ pk }) => !round.selected.includes(pk))?.id
      : voteCount.at(-1)?.id
    return {
      divideBefore,
      status: translate(round.status),
      method: translate(round.method),
      title: `${t('poll.result.round')} ${i + 1}`,
      proposalIds: round.selected.map(pkToPropId),
      voteCount
    }
  })
})
</script>
