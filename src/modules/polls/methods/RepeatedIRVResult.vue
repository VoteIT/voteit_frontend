<template>
  <div>
    <v-expansion-panels class="my-6">
      <v-expansion-panel v-for="{ proposalIds, status, title } in rounds" :key="title">
        <v-expansion-panel-title>
          {{ title }}: {{ status }}
          <Tag disabled :name="id" v-for="id in proposalIds" :key="id" class="ml-2" />
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ t('poll.IRV.repeatedRoundResult') }}
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-list density="comfortable" bg-color="background">
      <v-list-item v-for="([key, value], i) in metadata" :key="i">
        <v-list-item-subtitle>
          {{ key }}
        </v-list-item-subtitle>
        <v-list-item-title>
          {{ value }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import useProposals from '@/modules/proposals/useProposals'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ResultProps, ScottishSTVResult } from './types'

const translationMapping: Record<string, string | undefined> = {
  Direct: 'poll.STV.direct',
  Excluded: 'poll.STV.excluded',
  Elected: 'poll.STV.elected',
  'Tiebreak (Random)': 'poll.STV.tiebreakRandom',
  'No competition left': 'poll.STV.noCompetition'
}

const props = defineProps<ResultProps<ScottishSTVResult>>()

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

const rounds = computed(() => {
  return props.result.rounds.map((round, i) => {
    return {
      status: translate(round.status),
      title: `${t('poll.result.round')} ${i + 1}`,
      proposalIds: round.selected.map(pkToPropId)
    }
  })
})
</script>
