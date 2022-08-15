<template>
  <div>
    <v-expansion-panels class="my-6">
      <v-expansion-panel v-for="round in rounds" :key="round.title">
        <v-expansion-panel-title>
          {{ round.title }}: {{ round.status }}
          <Tag disabled :name="id" v-for="id in round.proposalIds" :key="id" class="ml-2" />
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list>
            <v-list-item v-for="[id, text] in round.voteCount" :key="id">
              <Tag disabled :name="id" class="mr-2" /> {{ text }}
            </v-list-item>
          </v-list>
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
    <slot/>
  </div>
</template>

<script lang="ts">
import useProposals from '@/modules/proposals/useProposals'
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import { ScottishSTVResult } from './types'

const translationMapping: Record<string, string | undefined> = {
  Direct: 'poll.STV.direct',
  Excluded: 'poll.STV.excluded',
  Elected: 'poll.STV.elected',
  'Tiebreak (Random)': 'poll.STV.tiebreakRandom',
  'No competition left': 'poll.STV.noCompetition'
}

export default defineComponent({
  props: {
    result: {
      type: Object as PropType<ScottishSTVResult>,
      required: true
    }
  },
  setup (props) {
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
          method: translate(round.method),
          title: `${t('poll.result.round')} ${i + 1}`,
          proposalIds: round.selected.map(pkToPropId),
          voteCount: round.vote_count.map(([pk, count]) => ([
            pkToPropId(pk), t('poll.result.voteCount',
            { count: String(count) }, Math.ceil(count))
          ]))
        }
      })
    })

    return {
      t,
      metadata,
      rounds,
      getProposal
    }
  }
})
</script>
